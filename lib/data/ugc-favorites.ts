import { createSupabaseService } from "../supabase";
import type { UgcFavorite } from "@/types/ugc";

export async function listFavorites(
  tenantId: string,
  userId: string
): Promise<UgcFavorite[]> {
  const { data, error } = await createSupabaseService()
    .from("ugc_favorites")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId);

  if (error) throw error;
  return data || [];
}

export async function addFavorite(
  tenantId: string,
  userId: string,
  variantId: string
): Promise<void> {
  const { error } = await createSupabaseService().from("ugc_favorites").insert({
    tenant_id: tenantId,
    user_id: userId,
    variant_id: variantId,
  });

  if (error) throw error;
}

export async function removeFavorite(
  tenantId: string,
  userId: string,
  variantId: string
): Promise<void> {
  const { error } = await createSupabaseService()
    .from("ugc_favorites")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .eq("variant_id", variantId);

  if (error) throw error;
}
