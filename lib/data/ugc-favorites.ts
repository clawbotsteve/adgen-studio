import { createSupabaseService } from "../supabase";
import type { UgcFavorite } from "@/types/ugc";

export async function listFavorites(
  tenantId: string,
  userId: string
): Promise<UgcFavorite[]> {
  const svc = createSupabaseService();
  const { data } = await svc
    .from("ugc_favorites")
    .select("tenant_id,user_id,variant_id,created_at")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []) as UgcFavorite[];
}

export async function toggleFavorite(
  tenantId: string,
  userId: string,
  variantId: string
): Promise<{ added: boolean }> {
  const svc = createSupabaseService();

  // Check if favorite exists
  const { data: existing } = await svc
    .from("ugc_favorites")
    .select("variant_id")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .eq("variant_id", variantId)
    .single();

  if (existing) {
    await svc
      .from("ugc_favorites")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .eq("variant_id", variantId);
    return { added: false };
  } else {
    const { error } = await svc
      .from("ugc_favorites")
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        variant_id: variantId,
      });
    if (error) throw new Error(`Failed to add favorite: ${error.message}`);
    return { added: true };
  }
}
