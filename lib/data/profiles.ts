import { createSupabaseService } from "../supabase";
import type { Profile } from "@/types/domain";

export async function listProfiles(tenantId: string): Promise<Profile[]> {
  const svc = createSupabaseService();
  const { data } = await svc
    .from("profiles")
    .select(
      "id,tenant_id,name,mode,endpoint,aspect_ratio,resolution,duration_seconds,audio_enabled,seed,prompt_prefix,prompt_suffix,cost_estimate_cents,created_at,updated_at"
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Profile[];
}

export async function getProfile(
  tenantId: string,
  profileId: string
): Promise<Profile | null> {
  const svc = createSupabaseService();
  const { data } = await svc
    .from("profiles")
    .select(
      "id,tenant_id,name,mode,endpoint,aspect_ratio,resolution,duration_seconds,audio_enabled,seed,prompt_prefix,prompt_suffix,cost_estimate_cents,created_at,updated_at"
    )
    .eq("tenant_id", tenantId)
    .eq("id", profileId)
    .single();
  return (data ?? null) as Profile | null;
}

export async function createProfile(
  tenantId: string,
  data: Omit<Profile, "id" | "tenant_id" | "created_at" | "updated_at">
): Promise<Profile> {
  const svc = createSupabaseService();
  const { data: result, error } = await svc
    .from("profiles")
    .insert({
      tenant_id: tenantId,
      name: data.name,
      mode: data.mode,
      endpoint: data.endpoint,
      aspect_ratio: data.aspect_ratio,
      resolution: data.resolution,
      duration_seconds: data.duration_seconds ?? null,
      audio_enabled: data.audio_enabled,
      seed: data.seed ?? null,
      prompt_prefix: data.prompt_prefix ?? null,
      prompt_suffix: data.prompt_suffix ?? null,
      cost_estimate_cents: data.cost_estimate_cents ?? null,
    })
    .select(
      "id,tenant_id,name,mode,endpoint,aspect_ratio,resolution,duration_seconds,audio_enabled,seed,prompt_prefix,prompt_suffix,cost_estimate_cents,created_at,updated_at"
    )
    .single();

  if (error) throw new Error(`Failed to create profile: ${error.message}`);
  return result as Profile;
}

export async function updateProfile(
  tenantId: string,
  profileId: string,
  data: Partial<Profile>
): Promise<Profile | null> {
  const svc = createSupabaseService();
  const updateData: Record<string, any> = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.mode !== undefined) updateData.mode = data.mode;
  if (data.endpoint !== undefined) updateData.endpoint = data.endpoint;
  if (data.aspect_ratio !== undefined) updateData.aspect_ratio = data.aspect_ratio;
  if (data.resolution !== undefined) updateData.resolution = data.resolution;
  if (data.duration_seconds !== undefined) updateData.duration_seconds = data.duration_seconds;
  if (data.audio_enabled !== undefined) updateData.audio_enabled = data.audio_enabled;
  if (data.seed !== undefined) updateData.seed = data.seed;
  if (data.prompt_prefix !== undefined) updateData.prompt_prefix = data.prompt_prefix;
  if (data.prompt_suffix !== undefined) updateData.prompt_suffix = data.prompt_suffix;
  if (data.cost_estimate_cents !== undefined)
    updateData.cost_estimate_cents = data.cost_estimate_cents;

  updateData.updated_at = new Date().toISOString();

  const { data: result } = await svc
    .from("profiles")
    .update(updateData)
    .eq("tenant_id", tenantId)
    .eq("id", profileId)
    .select(
      "id,tenant_id,name,mode,endpoint,aspect_ratio,resolution,duration_seconds,audio_enabled,seed,prompt_prefix,prompt_suffix,cost_estimate_cents,created_at,updated_at"
    )
    .single();
  return (result ?? null) as Profile | null;
}

export async function deleteProfile(tenantId: string, profileId: string): Promise<boolean> {
  const svc = createSupabaseService();
  const { error } = await svc
    .from("profiles")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", profileId);
  return !error;
}
