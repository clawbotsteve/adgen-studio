import { createSupabaseService } from "../supabase";
import type { ClientAvatar } from "A/types/ugc";

const FIELDS =
  "id,tenant_id,brand_id,name,avatar_type,provider,preview_image_url,source_asset_url,is_active,created_at";

export async function listAvatars(
  tenantId: string,
  brandId?: string
): Promise<ClientAvatar[]> {
  const svc = createSupabaseService();
  let query = svc
    .from("client_avatars")
    .select(FIELDS)
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  if (brandId) query = query.eq("brand_id", brandId);

  const { data } = await query.order("created_at", { ascending: false });
  return (data ?? []) as ClientAvatar[];
}

export async function createAvatar(
  tenantId: string,
  data: {
    brand_id: string;
    name: string;
    avatar_type?: string;
    provider?: string;
    preview_image_url?: string;
    source_asset_url?: string;
  }
): Promise<ClientAvatar> {
  const svc = createSupabaseService();
  const { data: result, error } = await svc
    .from("client_avatars")
    .insert({
      tenant_id: tenantId,
      brand_id: data.brand_id,
      name: data.name,
      avatar_type: data.avatar_type ?? "premade",
      provider: data.provider ?? null,
      preview_image_url: data.preview_image_url ?? null,
      source_asset_url: data.source_asset_url ?? null,
      is_active: true,
    })
    .select(FIELDS)
    .single();

  if (error) throw new Error(`Failed to create avatar: ${error.message}`);
  return result as ClientAvatar;
}

export async function updateAvatar(
  tenantId: string,
  avatarId: string,
  data: Partial<Pick<ClientAvatar, "name" | "avatar_type" | "provider" | "preview_image_url" | "source_asset_url" | "is_active">>
): Promise<ClientAvatar | null> {
  const svc = createSupabaseService();
  const update: Record<string, unknown> = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.avatar_type !== undefined) update.avatar_type = data.avatar_type;
  if (data.provider !== undefined) update.provider = data.provider;
  if (data.preview_image_url !== undefined) update.preview_image_url = data.preview_image_url;
  if (data.source_asset_url !== undefined) update.source_asset_url = data.source_asset_url;
  if (data.is_active !== undefined) update.is_active = data.is_active;

  const { data: result } = await svc
    .from("client_avatars")
    .update(update)
    .eq("tenant_id", tenantId)
    .eq("id", avatarId)
    .select(FIELDS)
    .single();
  return (result ?? null) as ClientAvatar | null;
}

export async function deleteAvatar(tenantId: string, avatarId: string): Promise<boolean> {
  const svc = createSupabaseService();
  const { error } = await svc
    .from("client_avatars")
    .update({ is_active: false })
    .eq("tenant_id", tenantId)
    .eq("id", avatarId);
  return !error;
}
