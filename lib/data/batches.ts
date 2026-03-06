import { createSupabaseService } from "../supabase";
import type { BatchRun, BatchItemResult } from "@/types/domain";

export async function listBatchRuns(
  tenantId: string,
  filters?: { clientId?: string; status?: string; limit?: number }
): Promise<BatchRun[]> {
  const svc = createSupabaseService();
  let query = svc
    .from("batch_runs")
    .select(
      "id,tenant_id,client_id,profile_id,prompt_pack_id,status,total_items,queued_count,running_count,completed_count,failed_count,started_at,stopped_at,created_by,created_at"
    )
    .eq("tenant_id", tenantId);

  if (filters?.clientId) {
    query = query.eq("client_id", filters.clientId);
  }

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  const limit = filters?.limit ?? 100;
  query = query.order("created_at", { ascending: false }).limit(limit);

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
    .select(
      "id,tenant_id,client_id,profile_id,prompt_pack_id,status,total_items,queued_count,running_count,completed_count,failed_count,started_at,stopped_at,created_by,created_at"
    )
    .eq("tenant_id", tenantId)
    .eq("id", runId)
    .single();
  return (data ?? null) as BatchRun | null;
}

export async function createBatchRun(
  tenantId: string,
  data: {
    client_id: string;
    profile_id: string;
    prompt_pack_id: string;
    total_items: number;
    created_by: string;
  }
): Promise<BatchRun> {
  const svc = createSupabaseService();
  const { data: result, error } = await svc
    .from("batch_runs")
    .insert({
      tenant_id: tenantId,
      client_id: data.client_id,
      profile_id: data.profile_id,
      prompt_pack_id: data.prompt_pack_id,
      status: "running",
      total_items: data.total_items,
      queued_count: data.total_items,
      running_count: 0,
      completed_count: 0,
      failed_count: 0,
      started_at: new Date().toISOString(),
      stopped_at: null,
      created_by: data.created_by,
    })
    .select(
      "id,tenant_id,client_id,profile_id,prompt_pacck_id,status,total_items,queued_count,running_count,completed_count,failed_count,started_at,stopped_at,created_by,created_at"
    )
    .single();

  if (error) throw new Error(`Failed to create batch run: ${error.message}`);
  return result as BatchRun;
}

export async function updateBatchRunStatus(
  runId: string,
  status: string,
  counts?: Partial<
    Pick<
      BatchRun,
      "queued_count" | "running_count" | "completed_count" | "failed_count"
    >
  >
): Promise<void> {
  const svc = createSupabaseService();
  const updateData: Record<string, string | number> = { status };

  if (counts) {
    if (counts.queued_count !== undefined)
      updateData.queued_count = counts.queued_count;
    if (counts.running_count !== undefined)
      updateData.running_count = counts.running_count;
    if (counts.completed_count !== undefined)
      updateData.completed_count = counts.completed_count;
    if (counts.failed_count !== undefined)
      updateData.failed_count = counts.failed_count;
  }

  const { error } = await svc
    .from("batch_runs")
    .update(updateData)
    .eq("id", runId);

  if (error) throw new Error(`Failed to update batch run status: ${error.message}`);
}

export async function createBatchItems(
  runId: string,
  items: Array<{ prompt_item_id: string; concept: string; prompt: string }>
): Promise<number> {
  const svc = createSupabaseService();

  const insertData = items.map((item) => ({
    batch_run_id: runId,
    prompt_item_id: item.prompt_item_id,
    concept: item.concept,
    prompt: item.prompt,
    status: "queued",
    output_url: null,
    error_message: null,
    error_code: null,
    retry_count: 0,
    started_at: null,
    completed_at: null,
  }));

  const { error, data: result } = await svc
    .from("batch_item_results")
    .insert(insertData)
    .select("id");

  if (error) throw new Error(`Failed to create batch items: ${error.message}`);
  return result?.length ?? 0;
}

export async function getBatchRunStatus(
  runId: string
): Promise<{
  status: string;
  total_items: number;
  queued_count: number;
  running_count: number;
  completed_count: number;
  failed_count: number;
  started_at: string | null;
} | null> {
  const svc = createSupabaseService();
  const { data } = await svc
    .from("batch_runs")
    .select(
      "status,total_items,queued_count,running_count,completed_count,failed_count,started_at"
    )
    .eq("id", runId)
    .single();
  return data;
}

export async function listBatchOutputs(
  runId: string,
  statusFilter?: string
): Promise<BatchItemResult[]> {
  const svc = createSupabaseService();
  let query = svc
    .from("batch_item_results")
    .select(
      "id,batch_run_id,prompt_item_id,concept,prompt,status,output_url,error_message,error_code,retry_count,started_at,completed_at,created_at"
    )
    .eq("batch_run_id", runId);

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data } = await query.order("created_at", { ascending: false });
  return (data ?? []) as BatchItemResult[];
}

export async function listBatchErrors(runId: string): Promise<BatchItemResult[]> {
  const svc = createSupabaseService();
  const { data } = await svc
    .from("batch_item_results")
    .select(
      "id,batch_run_id,prompt_item_id,concept,prompt,status,output_url,error_message,error_code,retry_count,started_at,completed_at,created_at"
    )
    .eq("batch_run_id", runId)
    .eq("status", "failed")
    .order("created_at", { ascending: false });
  return (data ?? []) as BatchItemResult[];
}

export async function cloneBatchRun(
  tenantId: string,
  originalRunId: string,
  userId: string
): Promise<BatchRun | null> {
  const svc = createSupabaseService();

  // Get the original batch run
  const { data: originalRun } = await svc
    .from("batch_runs")
    .select(
      "client_id,profile_id,prompt_pack_id,total_items,queued_count,running_count,completed_count,failed_count"
    )
    .eq("id", originalRunId)
    .single();

  if (!originalRun) return null;

  // Create new batch run
  const { data: newRun, error: runError } = await svc
    .from("batch_runs")
    .insert({
      tenant_id: tenantId,
      client_id: originalRun.client_id,
      profile_id: originalRun.profile_id,
      prompt_pack_id: originalRun.prompt_pack_id,
      status: "running",
      total_items: originalRun.total_items,
      queued_count: originalRun.total_items,
      running_count: 0,
      completed_count: 0,
      failed_count: 0,

      started_at: new Date().toISOString(),
      stopped_at: null,
      created_by: userId,
    })
    .select(
      "id,tenant_id,client_id,profile_id,prompt_pack_id,status,total_items,queued_count,running_count,completed_count,failed_count,started_at,stopped_at,created_by,created_at"
    )
    .single();

  if (runError) return null;

  // Get items from original batch
  const { data: originalItems } = await svc
    .from("batch_item_results")
    .select("prompt_item_id,concept,prompt")
    .eq("batch_run_id", originalRunId);

  if (!originalItems || originalItems.length === 0) return newRun as BatchRun;

  // Create new batch items
  const newItems = originalItems.map((item) => ({
    batch_run_id: newRun.id,
    prompt_item_id: item.prompt_item_id,
    concept: item.concept,
    prompt: item.prompt,
    status: "queued",
    output_url: null,
    error_message: null,
    error_code: null,
    retry_count: 0,
    started_at: null,
    completed_at: null,
  }));

  await svc.from("batch_item_results").insert(newItems);

  return newRun as BatchRun;
}
