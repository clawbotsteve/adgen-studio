import { createSupabaseService } from "../supabase";
import type { UgcConcept, UgcConceptStatus } from "@/types/ugc";

export async function listConcepts(
  tenantId: string,
  brandId?: string
): Promise<UgcConcept[]> {
  let query = createSupabaseService()
    .from("ugc_concepts")
    .select("*")
    .eq("tenant_id", tenantId);
 
  if (brandId) query = query.eq("brand_id", brandId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getConcept(id: string): Promise<UgcConcept> {
  const { data, error } = await createSupabaseService()
    .from("ugc_concepts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function createConcept(concept: {
  tenant_id: string;
  brand_id: string;
  title: string;
  prompt?: string;
}): Promise<UgcConcept> {
  const { data, error } = await createSupabaseService()
    .from("ugc_concepts")
    .insert(concept)
    .select();

  if (error) throw error;
  return data[0];
}

export async function updateConceptStatus(
  id: string,
  status: UgcConceptStatus
): Promise<void> {
  const { error } = await createSupabaseService()
    .from("ugc_concepts")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
}
