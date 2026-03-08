import { createSupabaseService } from "../supabase";
import type { AvatarVoicePreset } from "@/types/ugc";

export async function listPresets(
  tenantId: string,
  brandId: string
): Promise<AvatarVoicePreset[]> {
  const { data, error } = await createSupabaseService()
    .from("avatar_voice_presets")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("brand_id", brandId);
    
  if (error) throw error;
  return data || [];
}

export async function createPreset(preset: Omit<AvatarVoicePreset, "id" | "created_at" |,"created_by">): Promise<AvatarVoicePreset> {
  const { data, error } = await createSupabaseService()
    .from("avatar_voice_presets")
    .insert(preset)
    .select()
    .single();

  if (error) throw error;
  return data;
}
