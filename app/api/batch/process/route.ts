import { NextResponse } from "next/server";
import { createSupabaseService } from "@/lib/supabase";
import { generateImage } from "@/lib/fal";

/**
 * POST /api/batch/process
 * Processes queued batch items for a given batch run.
 * Called internally after batch creation (no auth needed for internal calls,
 * but we validate the runId exists).
 *
 * This processes items sequentially to avoid overwhelming FAL API,
 * with concurrency of up to 3 items at a time.
 */

const CONCURRENCY = 3;

export const maxDuration = 300; // 5 min max for Vercel

export async function POST(request: Request) {
  const body = (await request.json()) as {
    runId?: string;
    tenantId?: string;
    profileId?: string;
    clientId?: string;
    aspectRatio?: string;
    resolution?: string;
  };

  if (!body.runId || !body.tenantId) {
    return NextResponse.json(
      { error: "Missing runId or tenantId" },
      { status: 400 }
    );
  }

  const svc = createSupabaseService();

  try {
    // Get the batch run
    const { data: batchRun, error: runErr } = await svc
      .from("batch_runs")
      .select("*")
      .eq("id", body.runId)
      .single();

    if (runErr || !batchRun) {
      return NextResponse.json(
        { error: "Batch run not found" },
        { status: 404 }
      );
    }

    // Update batch run to running
    await svc
      .from("batch_runs")
      .update({ status: "running", started_at: new Date().toISOString() })
      .eq("id", body.runId);

    // Get the profile for reference image and settings
    let referenceImageUrl: string | undefined;
    let profileAspectRatio = body.aspectRatio || "1:1";
    let profileResolution = body.resolution || "2K";

    if (body.profileId) {
      const { data: profile } = await svc
        .from("profiles")
        .select("*")
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
        // Fallback: get any reference image for this client
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
    const { data: items, error: itemsErr } = await svc
      .from("batch_item_results")
      .select("*")
      .eq("batch_run_id", body.runId)
      .eq("status", "queued")
      .order("created_at", { ascending: true });

    if (itemsErr || !items || items.length === 0) {
      await svc
        .from("batch_runs")
        .update({
          status: "completed",
          stopped_at: new Date().toISOString(),
        })
        .eq("id", body.runId);

      return NextResponse.json({ processed: 0, message: "No items to process" });
    }

    let completedCount = 0;
    let failedCount = 0;

    // Process items in batches of CONCURRENCY
    for (let i = 0; i < items.length; i += CONCURRENCY) {
      // Check if batch was stopped/paused
      const { data: currentRun } = await svc
        .from("batch_runs")
        .select("status")
        .eq("id", body.runId)
        .single();

      if (currentRun?.status === "stopped" || currentRun?.status === "paused") {
        break;
      }

      const chunk = items.slice(i, i + CONCURRENCY);

      const results = await Promise.allSettled(
        chunk.map(async (item) => {
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
            // Generate image via FAL
            const outputUrl = await generateImage(
              item.prompt || item.concept || "Generate creative ad",
              referenceImageUrl,
              {
                aspectRatio: profileAspectRatio,
                resolution: profileResolution,
              }
            );

            // Mark as completed with resolution for billing
            await svc
              .from("batch_item_results")
              .update({
                status: "completed",
                output_url: outputUrl,
                resolution: profileResolution,
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

            return { success: false, itemId: item.id, error: errMsg };
          }
        })
      );

      // Count results
      for (const r of results) {
        if (r.status === "fulfilled" && r.value.success) {
          completedCount++;
        } else {
          failedCount++;
        }
      }

      // Update counts after each chunk
      await updateCounts(svc, body.runId!);
    }

    // Final status update
    const finalStatus =
      failedCount === items.length
        ? "failed"
        : "completed";

    await svc
      .from("batch_runs")
      .update({
        status: finalStatus,
        stopped_at: new Date().toISOString(),
      })
      .eq("id", body.runId);

    await updateCounts(svc, body.runId!);

    return NextResponse.json({
      processed: completedCount + failedCount,
      completed: completedCount,
      failed: failedCount,
    });
  } catch (error) {
    console.error("[batch/process] Error:", error);

    // Mark batch as failed
    await svc
      .from("batch_runs")
      .update({ status: "failed", stopped_at: new Date().toISOString() })
      .eq("id", body.runId);

    return NextResponse.json(
      { error: "Batch processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Recalculate and update the batch run counts from actual item statuses.
 */
async function updateCounts(
  svc: ReturnType<typeof createSupabaseService>,
  runId: string
) {
  const { data: allItems } = await svc
    .from("batch_item_results")
    .select("status")
    .eq("batch_run_id", runId);

  if (!allItems) return;

  const counts = {
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
