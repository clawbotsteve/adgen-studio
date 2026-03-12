import { createSupabaseService } from "../supabase";
import type { Client } from "@/types/domain";

export async function listClients(tenantId: string): Promise<Client[]> {
  const svc = createSupabaseService();
  const { data } = await svc
    .from("clients")
    .select("id,tenant_id,name,description,defaults,archived_at,created_at,updated_at")
    .eq("tenant_id", tenantId)
    .is("archived_at", null)
    .order("created_at", { ascending: false });
  return (data ?? []) as Client[];
}

export async function getClient(tenantId: string, clientId: string): Promise<Client | null> {
  const svc = createSupabaseService();
  const { data } = await svc
    .from("clients")
    .select("id,tenant_id,name,description,defaults,archived_at,created_at,updated_at")
    .eq("tenant_id", tenantId)
    .eq("id", clientId)
    .single();
  return (data ?? null) as Client | null;
}

export async function createClient(
  tenantId: string,
  name: string,
  description?: string,
  defaults?: Record<string, unknown>
): Promise<Client> {
  const svc = createSupabaseService();
  const { data: result, error } = await svc
    .from("clients")
    .insert({
      tenant_id: tenantId,
      name,
      description: description ?? null,
      defaults: defaults ?? null,
      archived_at: null,
    })
    .select("id,tenant_id,name,description,defaults,archived_at,created_at,updated_at")
    .single();

  if (error) throw new Error(`Failed to create client: ${error.message}`);
  return result as Client;
}

export async function updateClient(
  tenantId: string,
  clientId: string,
  data: Partial<Pick<Client, "name" | "description" | "defaults">>
): Promise<Client> {
  const svc = createSupabaseService();
  const { data: result, error } = await svc
    .from("clients")
    .update({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.defaults !== undefined && { defaults: data.defaults }),
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", tenantId)
    .eq("id", clientId)
    .select("id,tenant_id,name,description,defaults,archived_at,created_at,updated_at")
    .single();

  if (error) throw new Error(`Failed to update client: ${error.message}`);
  return result as Client;
}

export async function deleteClient(tenantId: string, clientId: string): Promise<void> {
  const svc = createSupabaseService();
  const { error } = await svc
    .from("clients")
    .update({ archived_at: new Date().toISOString() })
    .eq("tenant_id", tenantId)
    .eq("id", clientId);

  if (error) throw new Error(`Failed to delete client: ${error.message}`);
}
