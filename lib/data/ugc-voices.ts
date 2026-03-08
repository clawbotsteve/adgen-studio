import { createSupabaseService } from "../supabase";
import type { ClientVoice } from "@/types/ugc";

export async function listVoices(
  tenantId: string,
  brandId: string
): Promise<ClientVoice[]> {
  const { data, error } = await createSupabaseService()
    .from("client_voices")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("brand_id", brandId);
   
  if (error) throw error;
  return data || [];
}

export async function createVoice(voice: Omit<ClientVoice, "id" | "created_at">): Promise<ClientVoice> {
  const { data, error } = await createSupabaseService()
    .from("client_voices")
    .insert(voice)
    .select()
    .single();

  if (error) throw error;
  return data;
}
