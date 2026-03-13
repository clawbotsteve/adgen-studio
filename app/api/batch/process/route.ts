import { NextResponse } from "next/server";
import { createSupabaseService } from "@/lib/supabase";
import { generateImage } from "@/lib/fal";

// Extend Vercel function timeout to 60s
export const maxDuration = 60;

/**
 * POST /api/batch/process
 * Processes queued batch items for a given batch run.
 */
export async function POST(request: Request) {
  const svc = createSupabaseService();
  const body = (await request.json()) as {
    runId?: string;
    clientId?: string;
    profileId?: string;
    promptPackId?: string;
    briefText?: string;
    additionalContext?: string;
    useBrandContext?: boolean;
    aspectRatio?: string;
    resolution?: string;
  };

  if (!body.runId) {
    return NextResponse.json({ error: "Missing runId" }, { status: 400 });
  }

  // Look up profile for aspect/resolution defaults
  let profileAspectRatio = body.aspectRatio || "1:1";
  let profileResolution = body.resolution || "2K";
  let referenceImageUrl: string | undefined;

  if (body.profileId) {
    const { data: profile } = await svc
      .from("profiles")
      .select("aspect_ratio, resolution")
      .eq("id", body.profileId)
      .single();

    if (profile) {
      profileAspectRatio = body.aspectRatio || profile.aspect_ratio || "1:1";
      profileResolution = body.resolution || profile.resolution || "2K";
    }
  }

  // Get reference image for this client
  if (body.clientId) {
    const { data: refs } = await svc
      .from("reference_images")
      .select("url")
      .eq("client_id", body.clientId)
      .eq("is_primary", true)
      .limit(1);

    if (refs && refs.length > 0) {
      referenceImageUrl = refs[0].url;
    } else {
      const { data: anyRef } = await svc
        .from("reference_images")
        .select("url")
        .eq("client_id", body.clientId)
        .limit(1);

      if (anyRef && anyRef.length > 0) {
        referenceImageUrl = anyRef[0].url;
      }
    }
  }

  // Get queued items — process 1 at a time to avoid timeout
  const { data: items, error: itemsError } = await svc
    .from("batch_item_results")
    .select("*")
    .eq("batch_run_id", body.runId)
    .eq("status", "queued")
    .limit(1);

  if (itemsError || !items || items.length === 0) {
    // Check for stuck processing items and mark complete
    await finalizeRun(svc, body.runId);
    return NextResponse.json({ done: true });
  }

  const item = items[0];

  // Mark as processing
  await svc
    .from("batch_item_results")
    .update({ status: "processing", started_at: new Date().toISOString() })
    .eq("id", item.id);

  await updateCounts(svc, body.runId);

  try {
    // Generate image with 50s timeout
    const genResult = await withTimeout(
      generateImage(
        item.prompt || item.concept || "Generate creative ad",
        referenceImageUrl,
        { aspectRatio: profileAspectRatio, resolution: profileResolution }
      ),
      50000
    );

    const imageUrl =
      typeof genResult.url === "string"
        ? genResult.url
        : typeof genResult === "object" && (genResult as any)?.url
          ? String((genResult as any).url)
          : String(genResult);
    const width = genResult.width || 1024;
    const height = genResult.height || 1024;

    await svc
      .from("batch_item_results")
      .update({
        status: "completed",
        output_url: imageUrl,
        output_meta: { width, height },
        completed_at: new Date().toISOString(),
      })
      .eq("id", item.id);
  } catch (genErr) {
    const errMsg = genErr instanceof Error ? genErr.message : String(genErr);

    await svc
      .from("batch_item_results")
      .update({
        status: "failed",
        error_message: errMsg,
        completed_at: new Date().toISOString(),
      })
      .eq("id", item.id);
  }

  await updateCounts(svc, body.runId);

  // Continue processing remaining items
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  fetch(`${baseUrl}/api/batch/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => {});

  return NextResponse.json({ processed: 1 });
}

// Timeout wrapper
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Image generation timed out after " + (ms/1000) + "s")), ms);
    promise.then(v => { clearTimeout(timer); resolve(v); }).catch(e => { clearTimeout(timer); reject(e); });
  });
}

// Recalculate counts
async function updateCounts(svc: ReturnType<typeof createSupabaseService>, runId: string) {
  const { data: allItems } = await svc
    .from("batch_item_results")
    .select("status")
    .eq("batch_run_id", runId);

  if (!allItems) return;

  const counts: Record<string, number> = {
    total_items: allItems.length,
    queued_count: 0,
    running_count: 0,
    completed_count: 0,
    failed_count: 0,
  };

  for (const item of allItems) {
    switch (item.status) {
      case "queued": counts.queued_count++; break;
      case "processing": counts.running_count++; break;
      case "completed": counts.completed_count++; break;
      case "failed": counts.failed_count++; break;
    }
  }

  // If no items are queued or processing, mark run as done
  const isComplete = counts.queued_count === 0 && counts.running_count === 0;
  const status = isComplete ? (counts.failed_count > 0 ? "completed_with_errors" : "completed") : undefined;

  await svc.from("batch_runs").update({
    ...counts,
    ...(status ? { status } : {}),
  }).eq("id", runId);
}

// Finalize run — reset stuck processing items
async function finalizeRun(svc: ReturnType<typeof createSupabaseService>, runId: string) {
  // Reset any items stuck in "processing" back to "queued"
  await svc
    .from("batch_item_results")
    .update({ status: "queued", started_at: null })
    .eq("batch_run_id", runId)
    .eq("status", "processing");

  await updateCounts(svc, runId);
}