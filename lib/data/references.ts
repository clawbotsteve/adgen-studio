import { createSupabaseService } from "../supabase";
import type { ReferenceImage } from "@/types/domain";

export async function listReferences(
  tenantId: string,
  clientId?: string
): Promise<ReferenceImage[]> {
  const svc = createSupabaseService();
  let query = svc
    .from("reference_images")
    .select("id,tenant_id,client_id,label,url,tags,is_primary,file_size_bytes,created_at")
    .eq("tenant_id", tenantId);

  if (clientId) {
    query = query.eq("client_id", clientId);
  }

  const { data } = await query.order("created_at", { ascending: false });
  return (data ?? []) as ReferenceImage[];
}

export async function createReference(
  tenantId: string,
  data: {
    client_id: string;
    label: string;
    url: string;
    tags?: string[];
    is_primary?: boolean;
  }
): Promise<ReferenceImage> {
  const svc = createSupabaseService();
  const { data: result, error } = await svc
    .from("reference_images")
    .insert({
      tenant_id: tenantId,
      client_id: data.client_id,
      label: data.label,
      url: data.url,
      tags: data.tags ?? [],
      is_primary: data.is_primary ?? false,
      file_size_bytes: null,
    })
    .select("id,tenant_id,client_id,label,url,tags,is_primary,file_size_bytes,created_at")
    .single();

  if (error) throw new Error(`Failed to create reference: ${error.message}`);
  return result as ReferenceImage;
}

export async function deleteReference(tenantId: string, refId: string): Promise<boolean> {
  const svc = createSupabaseService();
  const { error } = await svc
    .from("reference_images")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", refId);
  return !error;
}

export async function setPrimaryReference(
  tenantId: string,
  clientId: string,
  refId: string
): Promise<boolean> {
  const svc = createSupabaseService();

  // First, set all other references for this client to not primary
  const { error: unsetError } = await svc
    .from("reference_images")
    .update({ is_primary: false })
    .eq("tenant_id", tenantId)
    .eq("client_id", clientId);

  if (unsetError) return false;

  // Then set the target reference to primary
  const { error: setError } = await svc
    .from("reference_images")
    .update({ is_primary: true })
    .eq("tenant_id", tenantId)
    .eq("id", refId);

  return !setError;
}
