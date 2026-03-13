import { NextResponse } from "next/server";
import { createSupabaseService } from "@/lib/supabase";
import { generateImage } from "@/lib/fal";

/**
 * POST /api/batch/process
 * Processes queued batch items for a given batch run.
 * Called internally after batch creation (no auth required).
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

  // Get reference image for this client — try primary first, then any
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
      // Fallback: any reference image for this client
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

  // Get all queued items for this batch
  const { data: items, error: itemsError } = await svc
    .from("batch_item_results")
    .select("*")
    .eq("batch_run_id", body.runId)
    .eq("status", "queued")
    .limit(3);

  if (itemsError || !items || items.length === 0) {
    // No more items to process
    return NextResponse.json({ done: true });
  }

  // Process items in parallel
  const results = await Promise.allSettled(
    items.map(async (item) => {
      // Mark as processing
      await svc
        .from("batch_item_results")
        .update({
          status: "processing",
          started_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      // Update running count
      await updateCounts(svc, body.runId!);

      try {
        // Generate the image
        const genResult = await generateImage(
          item.prompt || item.concept || "Generate creative ad",
          referenceImageUrl,
          {
            aspectRatio: profileAspectRatio,
            resolution: profileResolution,
          }
        );

        // Safety: ensure output_url is always a plain string URL
        const imageUrl =
          typeof genResult.url === "string"
            ? genResult.url
            : typeof genResult === "object" && (genResult as any)?.url
              ? String((genResult as any).url)
              : String(genResult);
        const width = genResult.width || 1024;
        const height = genResult.height || 1024;

        // Mark as completed and store output
        await svc
          .from("batch_item_results")
          .update({
            status: "completed",
            output_url: imageUrl,
            output_meta: { width, height },
            completed_at: new Date().toISOString(),
          })
          .eq("id", item.id);

        return { success: true, itemId: item.id };
      } catch (genErr) {
        const errMsg =
          genErr instanceof Error ? genErr.message : String(genErr);

        // Mark as failed
        await svc
          .from("batch_item_results")
          .update({
            status: "failed",
            error_message: errMsg,
            completed_at: new Date().toISOString(),
          })
          .eq("id", item.id);

        await updateCounts(svc, body.runId!);
        return { success: false, itemId: item.id, error: errMsg };
      }
    })
  );

  await updateCounts(svc, body.runId!);

  // Recursively process more items
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  await fetch(`${baseUrl}/api/batch/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => {});

  return NextResponse.json({
    processed: results.length,
    results: results.map((r) =>
      r.status === "fulfilled" ? r.value : { success: false, error: String(r.reason) }
    ),
  });
}

// Helper to recalculate counts
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
      case "queued":
        counts.queued_count++;
        break;
      case "processing":
        counts.running_count++;
        break;
      case "completed":
        counts.completed_count++;
        break;
      case "failed":
        counts.failed_count++;
        break;
    }
  }

  await svc.from("batch_runs").update(counts).eq("id", runId);
}
