import { createSupabaseService } from "../supabase";
import type { BatchRun, BatchItemResult } from "@/types/domain";

export async function listBatchRuns(
  tenantId: string,
  options?: { limit?: number; clientId?: string }
): Promise<BatchRun[]> {
  const svc = createSupabaseService();
  let query = svc
    .from("batch_runs")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (options?.clientId) {
    query = query.eq("client_id", options.clientId);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data } = await query;
  return (data ?? []) as BatchRun[];
}

export async function getBatchRun(
  tenantId: string,
  runId: string
): Promise<BatchRun | null> {
  const svc = createSupabaseService();
  const { data } = await svc
    .from("batch_runs")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", runId)
    .single();
  return data as BatchRun | null;
}

export async function getBatchRunStatus(runId: string): Promise<BatchRun | null> {
  const svc = createSupabaseService();
  const { data } = await svc
    .from("batch_runs")
    .select("*")
    .eq("id", runId)
    .single();
  return data as BatchRun | null;
}

export async function createBatchRun(params: {
  tenantId: string;
  clientId: string;
  profileId: string;
  promptPackId: string;
  totalItems: number;
  createdBy: string;
}): Promise<BatchRun> {
  const svc = createSupabaseService();
  const { data, error } = await svc
    .from("batch_runs")
    .insert({
      tenant_id: params.tenantId,
      client_id: params.clientId,
      profile_id: params.profileId,
      prompt_pack_id: params.promptPackId,
      status: "queued",
      total_items: params.totalItems,
      queued_count: params.totalItems,
      running_count: 0,
      completed_count: 0,
      failed_count: 0,
      created_by: params.createdBy,
    })
    .select()
    .single();

  if (error) throw error;
  return data as BatchRun;
}

export async function createBatchItems(
  batchRunId: string,
  items: { promptItemId: string; concept: string; prompt: string }[]
): Promise<void> {
  const svc = createSupabaseService();
  const rows = items.map((item) => ({
    batch_run_id: batchRunId,
    prompt_item_id: item.promptItemId,
    concept: item.concept,
    prompt: item.prompt,
    status: "queued",
  }));

  const { error } = await svc.from("batch_item_results").insert(rows);
  if (error) throw error;
}

export async function updateBatchRunStatus(
  runId: string,
  status: string,
  extra?: Record<string, unknown>
): Promise<void> {
  const svc = createSupabaseService();
  const update: Record<string, unknown> = { status, ...extra };
  const { error } = await svc
    .from("batch_runs")
    .update(update)
    .eq("id", runId);
  if (error) throw error;
}

export async function listBatchOutputs(
  batchRunId: string
): Promise<BatchItemResult[]> {
  const svc = createSupabaseService();
  const { data } = await svc
    .from("batch_item_results")
    .select("*")
    .eq("batch_run_id", batchRunId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false });
  return (data ?? []) as BatchItemResult[];
}

export async function listBatchErrors(
  batchRunId: string
): Promise<BatchItemResult[]> {
  const svc = createSupabaseService();
  const { data } = await svc
    .from("batch_item_results")
    .select("*")
    .eq("batch_run_id", batchRunId)
    .eq("status", "failed")
    .order("created_at", { ascending: false });
  return (data ?? []) as BatchItemResult[];
}

export async function cloneBatchRun(
  tenantId: string,
  runId: string,
  createdBy: string
): Promise<BatchRun> {
  const original = await getBatchRun(tenantId, runId);
  if (!original) throw new Error("Batch run not found");

  return createBatchRun({
    tenantId: original.tenant_id,
    clientId: original.client_id,
    profileId: original.profile_id,
    promptPackId: original.prompt_pack_id,
    totalItems: original.total_items,
    createdBy,
  });
}

export async function listAllClientContent(
  tenantId: string
): Promise<BatchItemResult[]> {
  const svc = createSupabaseService();
  // Get all batch runs for this tenant, then their completed outputs
  const { data: runs } = await svc
    .from("batch_runs")
    .select("id")
    .eq("tenant_id", tenantId);

  if (!runs || runs.length === 0) return [];

  const runIds = runs.map((r: { id: string }) => r.id);
  const { data } = await svc
    .from("batch_item_results")
    .select("*")
    .in("batch_run_id", runIds)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(200);

  return (data ?? []) as BatchItemResult[];
}
