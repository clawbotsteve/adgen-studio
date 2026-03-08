import { createSupabaseService } from "../supabase";
import type { UgcPerformance } from "@/types/ugc";

export async function listPerformance(
  variantId: string
): Promise<UgcPerformance[]> {
  const { data, error } = await createSupabaseService()
    .from("ugc_performance")
    .select("*")
    .eq("variant_id", variantId)
    .order("recorded_at", { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function recordPerformance(perf: Omit<UgcPerformance, "id" | "captured_at">): Promise<UgcPerformance> {
  const { data, error } = await createSupabaseService()
    .from("ugc_performance")
    .insert(perf)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function computeCTR(variantId: string): Promise<number | null> {
  const data = await listPerformance(variantId);
  
  const totalClicks = data.reduce((acc, d) => acc + (d.clicks || 0), 0);
  const totalImps = data.reduce((acc, d) => acc + (d.impressions || 0), 0);
  
  if (totalImps === 0) return null;
  return totalClicks / totalImps;
}
