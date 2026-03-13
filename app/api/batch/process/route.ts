import { NextResponse } from "next/server";
import { createSupabaseService } from "@/lib/supabase";
import { submitImage, checkImageStatus } from "@/lib/fal";

export const maxDuration = 60;

/**
 * POST /api/batch/process
 * Async queue: submit jobs to fal queue, poll for results.
 * Fire-and-forget recursive call (no setTimeout).
 */
export async function POST(request: Request) {
  const svc = createSupabaseService();
  const body = (await request.json()) as {
    runId?: string; clientId?: string; profileId?: string;
    promptPackId?: string; briefText?: string; additionalContext?: string;
    useBrandContext?: boolean; aspectRatio?: string; resolution?: string;
  };

  if (!body.runId) {
    return NextResponse.json({ error: "Missing runId" }, { status: 400 });
  }

  // ---- Resolve settings ----
  let aspectRatio = body.aspectRatio || "1:1";
  let resolution = body.resolution || "2K";
  let referenceImageUrl: string | undefined;

  if (body.profileId) {
    const { data: profile } = await svc
      .from("profiles").select("aspect_ratio, resolution")
      .eq("id", body.profileId).single();
    if (profile) {
      aspectRatio = body.aspectRatio || profile.aspect_ratio || "1:1";
      resolution = body.resolution || profile.resolution || "2K";
    }
  }

  if (body.clientId) {
    const { data: refs } = await svc
      .from("reference_images").select("url")
      .eq("client_id", body.clientId).eq("is_primary", true).limit(1);
    if (refs && refs.length > 0) {
      referenceImageUrl = refs[0].url;
    } else {
      const { data: anyRef } = await svc
        .from("reference_images").select("url")
        .eq("client_id", body.clientId).limit(1);
      if (anyRef && anyRef.length > 0) referenceImageUrl = anyRef[0].url;
    }
  }

  // ---- Phase 1: Submit queued items (up to 5 at once) ----
  const { data: queued } = await svc
    .from("batch_item_results").select("*")
    .eq("batch_run_id", body.runId).eq("status", "queued").limit(5);

  if (queued && queued.length > 0) {
    for (const item of queued) {
      try {
        const { requestId, model } = await submitImage(
          item.prompt || item.concept || "Generate creative ad",
          referenceImageUrl,
          { aspectRatio, resolution }
        );
        await svc.from("batch_item_results").update({
          status: "processing",
          started_at: new Date().toISOString(),
          output_meta: { fal_request_id: requestId, fal_model: model },
        }).eq("id", item.id);
      } catch (err) {
        await svc.from("batch_item_results").update({
          status: "failed",
          error_message: err instanceof Error ? err.message : String(err),
          completed_at: new Date().toISOString(),
        }).eq("id", item.id);
      }
    }
  }

  // ---- Phase 2: Poll processing items ----
  const { data: processing } = await svc
    .from("batch_item_results").select("*")
    .eq("batch_run_id", body.runId).eq("status", "processing").limit(10);

  if (processing && processing.length > 0) {
    for (const item of processing) {
      const meta = item.output_meta as any;
      if (!meta?.fal_request_id || !meta?.fal_model) continue;

      const result = await checkImageStatus(meta.fal_model, meta.fal_request_id);

      if (result.status === "completed" && result.url) {
        await svc.from("batch_item_results").update({
          status: "completed",
          output_url: result.url,
          output_meta: { width: result.width, height: result.height },
          completed_at: new Date().toISOString(),
        }).eq("id", item.id);
      } else if (result.status === "failed") {
        await svc.from("batch_item_results").update({
          status: "failed",
          error_message: result.error || "Generation failed",
          completed_at: new Date().toISOString(),
        }).eq("id", item.id);
      }
    }
  }

  // ---- Update counts ----
  await updateCounts(svc, body.runId);

  // ---- Check if more work remains ----
  const { data: remaining } = await svc
    .from("batch_item_results").select("status")
    .eq("batch_run_id", body.runId)
    .in("status", ["queued", "processing"]);

  if (remaining && remaining.length > 0) {
    // Fire-and-forget recursive call (no setTimeout!)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    fetch(`${baseUrl}/api/batch/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => {});
  }

  return NextResponse.json({
    submitted: queued?.length || 0,
    checked: processing?.length || 0,
    remaining: remaining?.length || 0,
  });
}

async function updateCounts(svc: ReturnType<typeof createSupabaseService>, runId: string) {
  const { data: allItems } = await svc
    .from("batch_item_results").select("status").eq("batch_run_id", runId);
  if (!allItems) return;
  const counts: Record<string, number> = {
    total_items: allItems.length, queued_count: 0,
    running_count: 0, completed_count: 0, failed_count: 0,
  };
  for (const item of allItems) {
    switch (item.status) {
      case "queued": counts.queued_count++; break;
      case "processing": counts.running_count++; break;
      case "completed": counts.completed_count++; break;
      case "failed": counts.failed_count++; break;
    }
  }
  const done = counts.queued_count === 0 && counts.running_count === 0;
  const status = done ? (counts.failed_count > 0 ? "completed_with_errors" : "completed") : undefined;
  await svc.from("batch_runs").update({ ...counts, ...(status ? { status } : {}) }).eq("id", runId);
}