import { createSupabaseService } from "./supabase";
import type { Brand, Job } from "@/types/domain";

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
