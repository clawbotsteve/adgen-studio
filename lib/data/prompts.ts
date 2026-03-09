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
  return ((data ?? []) as Array<Record<string, unknown>>).map((d) => ({ ...d, description: null })) as PromptPack[];
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

  if (error) throw new Error(`Failed to create prompt pack: ${error.message}`);
  return { ...result, description: data.description ?? null } as PromptPack;
}

export async function deletePromptPack(tenantId: string, packId: string): Promise<boolean> {
  const svc = createSupabaseService();

  // Delete all items first
  await svc.from("prompt_items").delete().eq("prompt_pack_id", packId);

  // Then delete the pack
  const { error } = await svc
    .from("prompt_packs")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", packId);

  return !error;
}

export async function listPromptItems(packId: string): Promise<PromptItem[]> {
  const svc = createSupabaseService();
  const { data } = await svc
    .from("prompt_items")
    .select("id,prompt_pack_id,concept,prompt_text,tags,sequence,created_at")
    .eq("prompt_pack_id", packId)
    .order("sequence", { ascending: true });
  return (data ?? []) as PromptItem[];
}

export async function createPromptItem(
  packId: string,
  data: { concept: string; prompt_text: string; tags?: string[]; sequence?: number }
): Promise<PromptItem> {
  const svc = createSupabaseService();

  // Get the next sequence number
  const { data: maxSeq } = await svc
    .from("prompt_items")
    .select("sequence")
    .eq("prompt_pack_id", packId)
    .order("sequence", { ascending: false })
    .limit(1)
    .single();

  const nextSequence = (maxSeq?.sequence ?? -1) + 1;

  const { data: result, error } = await svc
    .from("prompt_items")
    .insert({
      prompt_pack_id: packId,
      concept: data.concept,
      prompt_text: data.prompt_text,
      tags: data.tags ?? [],
      sequence: data.sequence ?? nextSequence,
    })
    .select("id,prompt_pack_id,concept,prompt_text,tags,sequence,created_at")
    .single();

  if (error) throw new Error(`Failed to create prompt item: ${error.message}`);

  // Update the item count in the pack
  await incrementPackItemCount(packId);

  return result as PromptItem;
}

export async function updatePromptItem(
  itemId: string,
  data: Partial<PromptItem>
): Promise<PromptItem | null> {
  const svc = createSupabaseService();
  const updateData: Record<string, unknown> = {};

  if (data.concept !== undefined) updateData.concept = data.concept;
  if (data.prompt_text !== undefined) updateData.prompt_text = data.prompt_text;
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.sequence !== undefined) updateData.sequence = data.sequence;

  const { data: result } = await svc
    .from("prompt_items")
    .update(updateData)
    .eq("id", itemId)
    .select("id,prompt_pack_id,concept,prompt_text,tags,sequence,created_at")
    .single();

  return (result ?? null) as PromptItem | null;
}

export async function deletePromptItem(itemId: string): Promise<boolean> {
  const svc = createSupabaseService();

  // Get the pack ID before deleting
  const { data: item } = await svc
    .from("prompt_items")
    .select("prompt_pack_id")
    .eq("id", itemId)
    .single();

  const { error } = await svc.from("prompt_items").delete().eq("id", itemId);

  if (!error && item) {
    // Decrement the item count
    await decrementPackItemCount(item.prompt_pack_id);
  }

  return !error;
}

export async function bulkCreatePromptItems(
  packId: string,
  items: Array<{ concept: string; prompt_text: string; tags?: string[] }>
): Promise<number> {
  const svc = createSupabaseService();

  // Get the current max sequence
  const { data: maxSeq } = await svc
    .from("prompt_items")
    .select("sequence")
    .eq("prompt_pack_id", packId)
    .order("sequence", { ascending: false })
    .limit(1)
    .single();

  let nextSequence = (maxSeq?.sequence ?? -1) + 1;

  const insertData = items.map((item) => ({
    prompt_pack_id: packId,
    concept: item.concept,
    prompt_text: item.prompt_text,
    tags: item.tags ?? [],
    sequence: nextSequence++,
  }));

  const { error, data: result } = await svc
    .from("prompt_items")
    .insert(insertData)
    .select("id");

  if (error) throw new Error(`Failed to bulk create items: ${error.message}`);

  // Update item count
  if (result) {
    await updatePackItemCount(packId);
  }

  return result?.length ?? 0;
}

async function incrementPackItemCount(packId: string): Promise<void> {
  const svc = createSupabaseService();
  const { data: pack } = await svc
    .from("prompt_packs")
    .select("item_count")
    .eq("id", packId)
    .single();

  if (pack) {
    await svc
      .from("prompt_packs")
      .update({ item_count: (pack.item_count ?? 0) + 1 })
      .eq("id", packId);
  }
}

async function decrementPackItemCount(packId: string): Promise<void> {
  const svc = createSupabaseService();
  const { data: pack } = await svc
    .from("prompt_packs")
    .select("item_count")
    .eq("id", packId)
    .single();

  if (pack && pack.item_count > 0) {
    await svc
      .from("prompt_packs")
      .update({ item_count: pack.item_count - 1 })
      .eq("id", packId);
  }
}

async function updatePackItemCount(packId: string): Promise<void> {
  const svc = createSupabaseService();
  const { count } = await svc
    .from("prompt_items")
    .select("id", { count: "exact" })
    .eq("prompt_pack_id", packId);

  await svc
    .from("prompt_packs")
    .update({ item_count: count ?? 0 })
    .eq("id", packId);
}
