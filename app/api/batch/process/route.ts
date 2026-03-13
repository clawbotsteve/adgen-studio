import { NextResponse } from "next/server";
import { createSupabaseService } from "@/lib/supabase";
import { generateImage } from "@/lib/fal";

export const maxDuration = 60;

export async function POST(request: Request) {
  const svc = createSupabaseService();
  const body = await request.json();
  if (!body.runId) return NextResponse.json({ error: "Missing runId" }, { status: 400 });

  // Resolve reference image
  let refUrl: string | undefined;
  if (body.clientId) {
    const { data: refs } = await svc.from("reference_images").select("url")
      .eq("client_id", body.clientId).eq("is_primary", true).limit(1);
    if (refs && refs.length > 0) {
      refUrl = refs[0].url;
    } else {
      const { data: anyRef } = await svc.from("reference_images").select("url")
        .eq("client_id", body.clientId).limit(1);
      if (anyRef && anyRef.length > 0) refUrl = anyRef[0].url;
    }
  }

  // Get ONE queued item
  const { data: items } = await svc.from("batch_item_results").select("*")
    .eq("batch_run_id", body.runId).eq("status", "queued").limit(1);

  if (!items || items.length === 0) {
    await updateCounts(svc, body.runId);
    return NextResponse.json({ done: true });
  }

  const item = items[0];

  // Mark as processing
  await svc.from("batch_item_results").update({
    status: "processing", started_at: new Date().toISOString()
  }).eq("id", item.id);
  await updateCounts(svc, body.runId);

  try {
    const genResult = await generateImage(
      item.prompt || item.concept || "Generate creative ad",
      refUrl,
      { aspectRatio: body.aspectRatio || "1:1", resolution: body.resolution || "2K" }
    );

    const imageUrl = typeof genResult.url === "string" ? genResult.url : String(genResult);

    await svc.from("batch_item_results").update({
      status: "completed",
      output_url: imageUrl,
      output_meta: { width: genResult.width || 1024, height: genResult.height || 1024 },
      completed_at: new Date().toISOString(),
    }).eq("id", item.id);
  } catch (err) {
    await svc.from("batch_item_results").update({
      status: "failed",
      error_message: err instanceof Error ? err.message : String(err),
      completed_at: new Date().toISOString(),
    }).eq("id", item.id);
  }

  await updateCounts(svc, body.runId);

  // Continue processing
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  fetch(baseUrl + "/api/batch/process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => {});

  return NextResponse.json({ processed: 1 });
}

async function updateCounts(svc: any, runId: string) {
  const { data: all } = await svc.from("batch_item_results").select("status").eq("batch_run_id", runId);
  if (!all) return;
  const counts: any = { total_items: all.length, queued_count: 0, running_count: 0, completed_count: 0, failed_count: 0 };
  all.forEach((i: any) => {
    if (i.status === "queued") counts.queued_count++;
    else if (i.status === "processing") counts.running_count++;
    else if (i.status === "completed") counts.completed_count++;
    else if (i.status === "failed") counts.failed_count++;
  });
  const done = counts.queued_count === 0 && counts.running_count === 0;
  await svc.from("batch_runs").update({
    ...counts,
    ...(done ? { status: counts.failed_count > 0 ? "completed_with_errors" : "completed" } : {}),
  }).eq("id", runId);
}