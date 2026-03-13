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

const CONCURRENCY = 1;

export const maxDuration = 60; // Vercel Hobby plan limit

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

    // Get reference images for this client
    // Priority: top_creative references → primary reference → any reference
    let referenceImageUrls: string[] = [];
    if (body.clientId) {
      // 1) Try top_creative references first (saved in Client Generator)
      const { data: topCreatives } = await svc
        .from("reference_images")
        .select("url")
        .eq("client_id", body.clientId)
        .eq("label", "top_creative")
        .order("created_at", { ascending: true });

      if (topCreatives && topCreatives.length > 0) {
        referenceImageUrls = topCreatives.map((r: { url: string }) => r.url);
        referenceImageUrl = referenceImageUrls[0];
      } else {
        // 2) Fallback: primary reference image
        const { data: refs } = await svc
          .from("reference_images")
          .select("url")
          .eq("client_id", body.clientId)
          .eq("is_primary", true)
          .limit(1);

        if (refs && refs.length > 0) {
          referenceImageUrl = refs[0].url;
        } else {
          // 3) Fallback: any reference image for this client
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
    }

    // Log reference image status for debugging
    if (referenceImageUrls.length > 0) {
      console.log(`[batch/process] Using ${referenceImageUrls.length} top creative reference(s) for client ${body.clientId}`);
    } else if (referenceImageUrl) {
      console.log(`[batch/process] Using fallback reference image for client ${body.clientId}`);
    } else {
      console.warn(`[batch/process] No reference images found for client ${body.clientId} — generation may fail or produce lower quality`);
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
            // Pick a reference image — rotate through top creatives if available
            let refUrl = referenceImageUrl;
            if (referenceImageUrls.length > 1) {
              const itemIdx = items.indexOf(item);
              refUrl = referenceImageUrls[itemIdx % referenceImageUrls.length];
            }

            // Generate image via FAL
            const outputUrl = await generateImage(
              item.prompt || item.concept || "Generate creative ad",
