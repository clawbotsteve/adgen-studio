import { createSupabaseService } from "../supabase";
import type { UgcVariant, UgcVariantStatus } from "@/types/ugc";

export async function listVariants(
  conceptId: string
): Promise<UgcVariant[]> {
  const { data, error } = await createSupabaseService()
    .from("ugc_variants")
    .select("*")
    .eq("concept_id", conceptId);
  
  if (error) throw error;
  return data || [];
}

export async function transformVariant(variant: UgcVariant): Promise<UgcVariant> {
  // To be implemented by app logic
  return variant;
}

export async function saveVariant(variant: UgcVariant): Promise<UgcVariant> {
  const { data, error } = await createSupabaseService()
    .from("ugc_variants")
    .upsert(variant, { onConflict: "update" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateVariantStatus(
  id: string,
  status: UgcVariantStatus
): Promise<void> {
  const { error } = await createSupabaseService()
    .from("ugc_variants")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
}
