import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { getBatchRun } from "@/lib/data/batches";
import { createSupabaseService } from "@/lib/supabase";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ runId: string; itemId: string }> }
) {
  const result = await requireUserTenantApi();
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  const { runId, itemId } = await params;
  const { tenant, user } = result;

  const batchRun = await getBatchRun(tenant.id, runId);
  if (!batchRun) {
    return NextResponse.json({ error: "Batch run not found" }, { status: 404 });
  }

  const svc = createSupabaseService();

  // Get the failed item
  const { data: item, error: fetchError } = await svc
    .from("batch_item_results")
    .select("id,prompt,status,retry_count")
    .eq("id", itemId)
    .eq("batch_run_id", runId)
    .single();

  if (fetchError || !item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  if (item.status !== "failed") {
    return NextResponse.json(
      { error: "Only failed items can be retried" },
      { status: 400 }
    );
  }

  // Parse optional edited prompt from request body
  let editedPrompt: string | null = null;
  try {
    const body = await request.json();
    if (body.edited_prompt && body.edited_prompt.trim() !== item.prompt.trim()) {
      editedPrompt = body.edited_prompt.trim();
    }
  } catch {
    // No body or invalid JSON — use original prompt
  }

  // Create retry job
  const { error: retryError } = await svc
    .from("retry_jobs")
    .insert({
      batch_run_id: runId,
      batch_item_result_id: itemId,
      original_prompt: item.prompt,
      edited_prompt: editedPrompt,
      status: "pending",
      output_url: null,
      error_message: null,
      created_by: user.id,
    });

  if (retryError) {
    return NextResponse.json(
      { error: `Failed to create retry job: ${retryError.message}` },
      { status: 500 }
    );
  }

  // Reset item status to queued, update prompt if edited
  const updateData: Record<string, unknown> = {
    status: "queued",
    error_message: null,
    error_code: null,
    started_at: null,
    completed_at: null,
    retry_count: item.retry_count ? Number(item.retry_count) + 1 : 1,
  };

  if (editedPrompt) {
    updateData.prompt = editedPrompt;
  }

  const { error: updateError } = await svc
    .from("batch_item_results")
    .update(updateData)
    .eq("id", itemId);

  if (updateError) {
    return NextResponse.json(
      { error: `Failed to reset item: ${updateError.message}` },
      { status: 500 }
    );
  }

  // Update batch run counts
  const { error: runUpdateError } = await svc
    .from("batch_runs")
    .update({
      status: "running",
      queued_count: batchRun.queued_count + 1,
      failed_count: Math.max(0, batchRun.failed_count - 1),
    })
    .eq("id", runId);

  if (runUpdateError) {
    console.error("[retry-item] Failed to update batch run:", runUpdateError);
  }

  return NextResponse.json({
    message: "Item queued for retry",
    editedPrompt: !!editedPrompt,
  });
}
