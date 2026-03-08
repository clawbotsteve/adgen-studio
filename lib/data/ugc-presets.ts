import { createSupabaseService } from "../supabase";
import type { AvatarVoicePreset } from "@/types/ugc";

const FIELDS =
  "id,tenant_id,brand_id,name,avatar_id,voice_id,default_language,default_tone,is_default,created_at";

export async function listPresets(
  tenantId: string,
  brandId?: string
): Promise<AvatarVoicePreset[]> {
  const svc = createSupabaseService();
  let query = svc
    .from("avatar_voice_presets")
    .select(FIELDS)
    .eq("tenant_id", tenantId);

  if (brandId) query = query.eq("brand_id", brandId);

  const { data } = await query.order("created_at", { ascending: false });
  return (data ?? []) as AvatarVoicePreset[];
}

export async function createPreset(
  tenantId: string,
  data: {
    brand_id: string;
    name: string;
    avatar_id?: string;
    voice_id?: string;
    default_language?: string;
    default_tone?: string;
    is_default?: boolean;
  }
): Promise<AvatarVoicePreset> {
  const svc = createSupabaseService();
  const { data: result, error } = await svc
    .from("avatar_voice_presets")
    .insert({
      tenant_id: tenantId,
      brand_id: data.brand_id,
      name: data.name,
      avatar_id: data.avatar_id ?? null,
      voice_id: data.voice_id ?? null,
      default_language: data.default_language ?? "en",
      default_tone: data.default_tone ?? null,
      is_default: data.is_default ?? false,
    })
    .select(FIELDS)
    .single();

  if (error) throw new Error(`Failed to create preset: ${error.message}`);
  return result as AvatarVoicePreset;
}

export async function updatePreset(
  tenantId: string,
  presetId: string,
  data: Partial<Pick<AvatarVoicePreset, "name" | "avatar_id" | "voice_id" | "default_language" | "default_tone" | "is_default">>
): Promise<AvatarVoicePreset | null> {
  const svc = createSupabaseService();
  const update: Record<string, unknown> = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.avatar_id !== undefined) update.avatar_id = data.avatar_id;
  if (data.voice_id !== undefined) update.voice_id = data.voice_id;
  if (data.default_language !== undefined) update.default_language = data.default_language;
  if (data.default_tone !== undefined) update.default_tone = data.default_tone;
  if (data.is_default !== undefined) update.is_default = data.is_default;

  const { data: result } = await svc
    .from("avatar_voice_presets")
    .update(update)
    .eq("tenant_id", tenantId)
    .eq("id", presetId)
    .select(FIELDS)
    .single();
  return (result ?? null) as AvatarVoicePreset | null;
}

export async function deletePreset(tenantId: string, presetId: string): Promise<boolean> {
  const svc = createSupabaseService();
  const { error } = await svc
    .from("avatar_voice_presets")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", presetId);
  return !error;
}
