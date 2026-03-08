import { createSupabaseService } from "../supabase";
import type { ClientAvatar } from "@/types/ugc";

export async function listAvatars(
  tenantId: string,
  brandId: string
): Promise<ClientAvatar[]> {
  const { data, error } = await createSupabaseService()
    .from("client_avatars")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("brand_id", brandId);
  
  if (error) throw error;
  return data || [];
}

export async function createAvatar(avatar: Omit<ClientAvatar, "id" | "created_at">): Promise<ClientAvatar> {
  const { data, error } = await createSupabaseService()
    .from("client_avatars")
    .insert(avatar)
    .select()
    .single();

  if (error) throw error;
  return data;
}
