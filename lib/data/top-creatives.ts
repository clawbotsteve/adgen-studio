import { createSupabaseService } from "../supabase";

export type TopCreative = {
  id: string;
  tenant_id: string;
  client_id: string;
  label: string;
  url: string;
  tags: string[];
  is_primary: boolean;
  file_size_bytes: number | null;
  created_at: string;
};

const FIELDS =
  "id,tenant_id,client_id,label,url,tags,is_primary,file_size_bytes,created_at";

/**
 * List all top-creative reference images for a given client.
 * Returns them ordered by creation date (oldest first = upload order).
 */
export async function listTopCreatives(
  tenantId: string,
  clientId: string
): Promise<TopCreative[]> {
  const svc = createSupabaseService();
  const { data } = await svc
    .from("reference_images")
    .select(FIELDS)
    .eq("tenant_id", tenantId)
    .eq("client_id", clientId)
    .eq("label", "top_creative")
    .order("created_at", { ascending: true });
  return (data ?? []) as TopCreative[];
}

/**
 * Add a top-creative reference image for a client.
 */
export async function addTopCreative(
  tenantId: string,
  clientId: string,
  doc: {
    url: string;
    file_size_bytes: number | null;
    tags?: string[];
  }
): Promise<TopCreative> {
  const svc = createSupabaseService();
  const { data: result, error } = await svc
    .from("reference_images")
    .insert({
      tenant_id: tenantId,
      client_id: clientId,
      label: "top_creative",
      url: doc.url,
      tags: doc.tags ?? [],
      is_primary: false,
      file_size_bytes: doc.file_size_bytes,
    })
    .select(FIELDS)
    .single();
  if (error) throw new Error(`Failed to add top creative: ${error.message}`);
  return result as TopCreative;
}

/**
 * Delete a top-creative reference image.
 */
export async function deleteTopCreative(
  tenantId: string,
  creativeId: string
): Promise<boolean> {
  const svc = createSupabaseService();
  const { error } = await svc
    .from("reference_images")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", creativeId)
    .eq("label", "top_creative");
  return !error;
}

/**
 * Count top creatives for a client.
 */
export async function countTopCreatives(
  tenantId: string,
  clientId: string
): Promise<number> {
  const svc = createSupabaseService();
  const { count } = await svc
    .from("reference_images")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("client_id", clientId)
    .eq("label", "top_creative");
  return count ?? 0;
}
