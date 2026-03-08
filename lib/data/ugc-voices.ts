import { createSupabaseService } from "../supabase";
import type { ClientVoice } from "@/types/ugc";

const FIELDS =
  "id,tenant_id,brand_id,name,provider,voice_id,language,style_tags,is_cloned,consent_doc_url,is_active,created_at";

export async function listVoices(
  tenantId: string,
  brandId?: string
): Promise<ClientVoice[]> {
  const svc = createSupabaseService();
  let query = svc
    .from("client_voices")
    .select(FIELDS)
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  if (brandId) query = query.eq("brand_id", brandId);

  const { data } = await query.order("created_at", { ascending: false });
  return (data ?? []) as ClientVoice[];
}

export async function createVoice(
  tenantId: string,
  data: {
    brand_id: string;
    name: string;
    provider?: string;
    voice_id?: string;
    language?: string;
    style_tags?: string[];
    is_cloned?: boolean;
    consent_doc_url?: string;
  }
): Promise<ClientVoice> {
  const svc = createSupabaseService();
  const { data: result, error } = await svc
    .from("client_voices")
    .insert({
      tenant_id: tenantId,
      brand_id: data.brand_id,
      name: data.name,
      provider: data.provider ?? null,
      voice_id: data.voice_id ?? null,
      language: data.language ?? "en",
      style_tags: data.style_tags ?? [],
      is_cloned: data.is_cloned ?? false,
      consent_doc_url: data.consent_doc_url ?? null,
      is_active: true,
    })
    .select(FIELDS)
    .single();

  if (error) throw new Error(`Failed to create voice: ${error.message}`);
  return result as ClientVoice;
}

export async function updateVoice(
  tenantId: string,
  voiceId: string,
  data: Partial<Pick<ClientVoice, "name" | "provider" | "voice_id" | "language" | "style_tags" | "is_cloned" | "consent_doc_url" | "is_active">>
): Promise<ClientVoice | null> {
  const svc = createSupabaseService();
  const update: Record<string, unknown> = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.provider !== undefined) update.provider = data.provider;
  if (data.voice_id !== undefined) update.voice_id = data.voice_id;
  if (data.language !== undefined) update.language = data.language;
  if (data.style_tags !== undefined) update.style_tags = data.style_tags;
  if (data.is_cloned !== undefined) update.is_cloned = data.is_cloned;
  if (data.consent_doc_url !== undefined) update.consent_doc_url = data.consent_doc_url;
  if (data.is_active !== undefined) update.is_active = data.is_active;

  const { data: result } = await svc
    .from("client_voices")
    .update(update)
    .eq("tenant_id", tenantId)
    .eq("id", voiceId)
    .select(FIELDS)
    .single();
  return (result ?? null) as ClientVoice | null;
}

export async function deleteVoice(tenantId: string, voiceId: string): Promise<boolean> {
  const svc = createSupabaseService();
  const { error } = await svc
    .from("client_voices")
    .update({ is_active: false })
    .eq("tenant_id", tenantId)
    .eq("id", voiceId);
  return !error;
}
