import { NextResponse } from "next/server";
import { createSupabaseService } from "@/lib/supabase";
import { submitImage, checkImageStatus } from "@/lib/fal";

export const maxDuration = 60;

export async function POST(request: Request) {
  const svc = createSupabaseService();
  const body = await request.json();
  if (!body.runId) return NextResponse.json({ error: "Missing runId" }, { status: 400 });

  const log: string[] = [];

  // Resolve reference image
  let refUrl: string | undefined;
  if (body.clientId) {
    const { data: refs } = await svc.from("reference_images").select("url").eq("client_id", body.clientId).limit(1);
    if (refs && refs.length > 0) refUrl = refs[0].url;
  }
  log.push("refUrl: " + (refUrl || "none"));

  // Phase 1: Submit queued items
  const { data: queued, error: qErr } = await svc
    .from("batch_item_results").select("id, concept, prompt, status")
    .eq("batch_run_id", body.runId).eq("status", "queued").limit(2);
  log.push("queued found: " + (queued?.length || 0) + " err: " + (qErr?.message || "none"));

  const itemResults: any[] = [];
  if (queued && queued.length > 0) {
    for (const item of queued) {
      try {
        log.push("submitting item " + item.id.substring(0,8) + "...");
        const { requestId, model } = await submitImage(
          item.prompt || item.concept || "Generate creative ad",
          refUrl,
          { aspectRatio: body.aspectRatio || "1:1", resolution: body.resolution || "2K" }
        );
        log.push("got requestId: " + requestId.substring(0,12) + " model: " + model);

        // Try update with output_meta
        const { error: upErr } = await svc.from("batch_item_results").update({
          status: "processing",
          started_at: new Date().toISOString(),
          output_meta: { fal_request_id: requestId, fal_model: model },
        }).eq("id", item.id);
        log.push("update result: " + (upErr ? upErr.message : "ok"));

        itemResults.push({ id: item.id.substring(0,8), requestId: requestId.substring(0,12), ok: !upErr });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.push("ERROR: " + msg);
        const { error: fErr } = await svc.from("batch_item_results").update({
          status: "failed",
          error_message: msg,
          completed_at: new Date().toISOString(),
        }).eq("id", item.id);
        log.push("fail update: " + (fErr ? fErr.message : "ok"));
        itemResults.push({ id: item.id.substring(0,8), error: msg, failUpdateOk: !fErr });
      }
    }
  }

  // Phase 2: Check processing items
  const { data: processing } = await svc
    .from("batch_item_results").select("id, output_meta")
    .eq("batch_run_id", body.runId).eq("status", "processing").limit(5);
  log.push("processing found: " + (processing?.length || 0));

  if (processing && processing.length > 0) {
    for (const item of processing) {
      const meta = item.output_meta as any;
      if (!meta?.fal_request_id) { log.push("skip item " + item.id.substring(0,8) + " no request_id"); continue; }
      const result = await checkImageStatus(meta.fal_model, meta.fal_request_id);
      log.push("check " + item.id.substring(0,8) + ": " + result.status);
      if (result.status === "completed" && result.url) {
        await svc.from("batch_item_results").update({ status: "completed", output_url: result.url, output_meta: { width: result.width, height: result.height }, completed_at: new Date().toISOString() }).eq("id", item.id);
      } else if (result.status === "failed") {
        await svc.from("batch_item_results").update({ status: "failed", error_message: result.error, completed_at: new Date().toISOString() }).eq("id", item.id);
      }
    }
  }

  // Update counts
  const { data: all } = await svc.from("batch_item_results").select("status").eq("batch_run_id", body.runId);
  if (all) {
    const c2: any = { total_items: all.length, queued_count: 0, running_count: 0, completed_count: 0, failed_count: 0 };
    all.forEach((i: any) => { if (i.status === "queued") c2.queued_count++; else if (i.status === "processing") c2.running_count++; else if (i.status === "completed") c2.completed_count++; else if (i.status === "failed") c2.failed_count++; });
    await svc.from("batch_runs").update(c2).eq("id", body.runId);
    log.push("counts: q=" + c2.queued_count + " r=" + c2.running_count + " c=" + c2.completed_count + " f=" + c2.failed_count);
  }

  // Recursive call if work remains
  const hasMore = all && all.some((i: any) => i.status === "queued" || i.status === "processing");
  if (hasMore) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    fetch(baseUrl + "/api/batch/process", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => {});
  }

  return NextResponse.json({ log, items: itemResults });
}