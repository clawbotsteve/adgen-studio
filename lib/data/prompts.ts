import { createSupabaseService } from "../supabase";
import type { PromptPack, PromptItem } from "@/types/domain";

export async function listPromptPacks(tenantId: string): Promise<PromptPack[]> {
  const svc = createSupabaseService();
  const { data } = await svc
    .from("prompt_packs")
    .select(
      "id,tenant_id,name,item_count,tags,created_at,updated_at"
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  return ((data ?? []) as Array<Record<string, unknown>>).map((d) => ({
    ...d,
    description: null,
  })) as PromptPack[];
}

export async function getPromptPack(
  tenantId: string,
  packId: string
): Promise<PromptPack | null> {
  const svc = createSupabaseService();
  const { data } = await svc
    .from("prompt_packs")
    .select(
      "id,tenant_id,name,item_count,tags,created_at,updated_at"
    )
    .eq("tenant_id", tenantId)
    .eq("id", packId)
    .single();
  return data ? ({ ...data, description: null } as PromptPack) : null;
}

export async function createPromptPack(
  tenantId: string,
  data: { name: string; description?: string; tags?: string[] }
): Promise<PromptPack> {
  const svc = createSupabaseService();
  const { data: result, error } = await svc
    .from("prompt_packs")
    .insert({
      tenant_id: tenantId,
      name: data.name,
      item_count: 0,
      tags: data.tags ?? [],
    })
    .select(
      "id,tenant_id,name,item_count,tags,created_at,updated_at"
    )
    .single();
