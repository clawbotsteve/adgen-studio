import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { getBatchRun, listBatchErrors } from "@/lib/data/batches";
import { createSupabaseService } from "@/lib/supabase";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  const result = await requireUserTenantApi();
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  const { runId } = await params;
  const { tenant, user } = result;

  const batchRun = await getBatchRun(tenant.id, runId);
  if (!batchRun) {
    return NextResponse.json({ error: "Batch run not found" }, { status: 404 });
  }

  const errors = await listBatchErrors(runId);
  if (errors.length === 0) {
    return NextResponse.json({ error: "No failed items to retry" }, { status: 400 });
  }

  const svc = createSupabaseService();

  // Create retry_jobs for each failed item
  const retryJobs = errors.map((err) => ({
    batch_run_id: runId,
    batch_item_result_id: err.id,
    original_prompt: err.prompt,
    edited_prompt: null,
    status: "pending",
    output_url: null,
    error_message: null,
    created_by: user.id,
  }));

  const { error: insertError } = await svc
    .from("retry_jobs")
    .insert(retryJobs);

  if (insertError) {
    return NextResponse.json(
      { error: `Failed to create retry jobs: ${insertError.message}` },
      { status: 500 }
    );
  }

  // Reset status of failed items to queued
  const failedIds = errors.map((e) => e.id);
  const { error: updateError } = await svc
    .from("batch_item_results")
    .update({
      status: "queued",
      error_message: null,
      error_code: null,
      started_at: null,
      completed_at: null,
    })
    .in("id", failedIds);

  if (updateError) {
    return NextResponse.json(
      { error: `Failed to reset items: ${updateError.message}` },
      { status: 500 }
    );
  }

  // Update batch run counts
  const { error: runUpdateError } = await svc
    .from("batch_runs")
    .update({
      status: "running",
      queued_count: batchRun.queued_count + errors.length,
      failed_count: 0,
    })
    .eq("id", runId);

  if (runUpdateError) {
    console.error("[retry-failed] Failed to update batch run:", runUpdateError);
  }

  return NextResponse.json({
    retried: errors.length,
    message: `${errors.length} items queued for retry`,
  });
}
