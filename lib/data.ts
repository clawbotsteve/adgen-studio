import { createSupabaseService } from "./supabase";
import type { Brand, Job, Client, BatchRun, ReferenceImage } from "@/types/domain";

export const listBrands = async (tenantId: string): Promise<Brand[]> => {
  const svc = createSupabaseService();
  const { data } = await svc
    .from("brands")
    .select("id,tenant_id,name,voice,drive_folder_id,created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Brand[];
};

export const listJobs = async (tenantId: string, limit = 100): Promise<Job[]> => {
  const svc = createSupabaseService();
  const { data } = await svc
    .from("jobs")
    .select("id,tenant_id,brand_id,prompt,output_url,status,created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Job[];
};

export const listClients = async (tenantId: string): Promise<Client[]> => {
  const svc = createSupabaseService();
  const { data } = await svc
    .from("clients")
    .select("id,tenant_id,name,description,defaults,archived_at,created_at,updated_at")
    .eq("tenant_id", tenantId)
    .is("archived_at", null)
    .order("created_at", { ascending: false });
  return (data ?? []) as Client[];
};

export const listBatchRuns = async (tenantId: string, limit = 50): Promise<BatchRun[]> => {
  const svc = createSupabaseService();
  const { data } = await svc
    .from("batch_runs")
    .select("id,tenant_id,client_id,profile_id,prompt_pack_id,status,total_items,queued_count,running_count,completed_count,failed_count,started_at,stopped_at,created_by,created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as BatchRun[];
};

export const listReferenceImages = async (tenantId: string): Promise<ReferenceImage[]> => {
  const svc = createSupabaseService();
  const { data } = await svc
    .from("reference_images")
    .select("id,tenant_id,client_id,label,url,tags,is_primary,file_size_bytes,created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  return (data ?? []) as ReferenceImage[];
};

export const countReferenceImages = async (tenantId: string): Promise<number> => {
  const svc = createSupabaseService();
  const { count } = await svc
    .from("reference_images")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);
  return count ?? 0;
};
