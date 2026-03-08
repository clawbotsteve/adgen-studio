import { createSupabaseService } from "../supabase";
import type { UgcConcept } from "@/types/ugc";

const FIELDS =
  "id,tenant_id,brand_id,title,hook_type,funnel_stage,tone,angle,persona,script_text,shot_list,status,created_by,created_at";

export async function listConcepts(
  tenantId: string,
  brandId?: string,
  status?: string
): Promise<UgcConcept[]> {
  const svc = createSupabaseService();
  let query = svc
    .from("ugc_concepts")
    .select(FIELDS)
    .eq("tenant_id", tenantId);

  if (brandId) query = query.eq("brand_id", brandId);
  if (status) query = query.eq("status", status);

  const { data } = await query.order("created_at", { ascending: false });
  return (data ?? []) as UgcConcept[];
}

export async function getConcept(
  tenantId: string,
  conceptId: string
): Promise<UgcConcept | null> {
  const svc = createSupabaseService();
  const { data } = await svc
    .from("ugc_concepts")
    .select(FIELDS)
    .eq("tenant_id", tenantId)
    .eq("id", conceptId)
    .single();
  return (data ?? null) as UgcConcept | null;
}

export async function createConcept(
  tenantId: string,
  data: {
    brand_id: string;
    title: string;
    hook_type?: string;
    funnel_stage?: string;
    tone?: string;
    angle?: string;
    persona?: string;
    script_text?: string;
    shot_list?: Record<string, unknown>[];
    created_by?: string;
  }
): Promise<UgcConcept> {
  const svc = createSupabaseService();
  const { data: result, error } = await svc
    .from("ugc_concepts")
    .insert({
      tenant_id: tenantId,
      brand_id: data.brand_id,
      title: data.title,
      hook_type: data.hook_type ?? null,
      funnel_stage: data.funnel_stage ?? null,
      tone: data.tone ?? null,
      angle: data.angle ?? null,
      persona: data.persona ?? null,
      script_text: data.script_text ?? null,
      shot_list: data.shot_list ?? null,
      created_by: data.created_by ?? null,
      status: "drafted",
    })
    .select(FIELDS)
    .single();

  if (error) throw new Error(`Failed to create concept: ${error.message}`);
  return result as UgcConcept;
}

export async function updateConcept(
  tenantId: string,
  conceptId: string,
  data: Partial<
    Pick<
      UgcConcept,
      | "title"
      | "hook_type"
      | "funnel_stage"
      | "tone"
      | "angle"
      | "persona"
      | "script_text"
      | "shot_list"
      | "status"
    >
  >
): Promise<UgcConcept | null> {
  const svc = createSupabaseService();
  const update: Record<string, unknown> = {};
  if (data.title !== undefined) update.title = data.title;
  if (data.hook_type !== undefined) update.hook_type = data.hook_type;
  if (data.funnel_stage !== undefined) update.funnel_stage = data.funnel_stage;
  if (data.tone !== undefined) update.tone = data.tone;
  if (data.angle !== undefined) update.angle = data.angle;
  if (data.persona !== undefined) update.persona = data.persona;
  if (data.script_text !== undefined) update.script_text = data.script_text;
  if (data.shot_list !== undefined) update.shot_list = data.shot_list;
  if (data.status !== undefined) update.status = data.status;

  const { data: result } = await svc
    .from("ugc_concepts")
    .update(update)
    .eq("tenant_id", tenantId)
    .eq("id", conceptId)
    .select(FIELDS)
    .single();
  return (result ?? null) as UgcConcept | null;
}
