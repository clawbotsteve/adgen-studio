import { createSupabaseService } from "../supabase";
import { computeKlingCost, computeClientCharge, computeMargin } from "../pricing";
import type { UgcVariant } from "A/types/ugc";

const FIELDS =
  "id,tenant_id,concept_id,kind,model_name,audio_tier,duration_sec,aspect_ratio,resolution,hook,cta,visual_angle,prompt,status,fal_cost_usd,client_charge_usd,margin_usd,output_url,output_drive_url,error_message,created_at";

export async function listVariants(
  tenantId: string,
  conceptId?: string,
  status?: string
): Promise<UgcVariant[]> {
  const svc = createSupabaseService();
  let query = svc
    .from("ugc_variants")
    .select(FIELDS)
    .eq("tenant_id", tenantId);

  if (conceptId) query = query.eq("concept_id", conceptId);
  if (status) query = query.eq("status", status);

  const { data } = await query.order("created_at", { ascending: false });
  return (data ?? []) as UgcVariant[];
}

export async function getVariant(
  tenantId: string,
  variantId: string
): Promise<UgcVariant | null> {
  const svc = createSupabaseService();
  const { data } = await svc
    .from("ugc_variants")
    .select(FIELDS)
    .eq("tenant_id", tenantId)
    .eq("id", variantId)
    .single();
  return (data ?? null) as UgcVariant | null;
}

export async function createVariant(
  tenantId: string,
  data: {
    concept_id: string;
    kind: "image" | "video";
    model_name: string;
    audio_tier?: string;
    duration_sec?: number;
    aspect_ratio?: string;
    resolution?: string;
    hook?: string;
    cta?: string;
    visual_angle?: string;
    prompt: string;
  }
): Promise<UgcVariant> {
  const svc = createSupabaseService();

  // Compute pricing for video variants
  let fal_cost_usd: number | null = null;
  let client_charge_usd: number | null = null;
  let margin_usd: number | null = null;

  if (data.kind === "video" && data.duration_sec) {
    const tier = data.audio_tier ?? "no_audio";
    fal_cost_usd = computeKlingCost(data.duration_sec, tier);
    client_charge_usd = computeClientCharge(fal_cost_usd);
    margin_usd = computeMargin(client_charge_usd, fal_cost_usd);
  }

  const { data: result, error } = await svc
    .from("ugc_variants")
    .insert({
      tenant_id: tenantId,
      concept_id: data.concept_id,
      kind: data.kind,
      model_name: data.model_name,
      audio_tier: data.audio_tier ?? "no_audio",
      duration_sec: data.duration_sec ?? null,
      aspect_ratio: data.aspect_ratio ?? null,
      resolution: data.resolution ?? null,
      hook: data.hook ?? null,
      cta: data.cta ?? null,
      visual_angle: data.visual_angle ?? null,
      prompt: data.prompt,
      status: "queued",
      fal_cost_usd,
      client_charge_usd,
      margin_usd,
    })
    .select(FIELDS)
    .single();

  if (error) throw new Error(`Failed to create variant: ${error.message}`);
  return result as UgcVariant;
}

export async function updateVariant(
  tenantId: string,
  variantId: string,
  data: Partial<Pick<UgcVariant, "status" | "output_url" | "output_drive_url" | "error_message">>
): Promise<UgcVariant | null> {
  const svc = createSupabaseService();
  const update: Record<string, unknown> = {};
  if (data.status !== undefined) update.status = data.status;
  if (data.output_url !== undefined) update.output_url = data.output_url;
  if (data.output_drive_url !== undefined) update.output_drive_url = data.output_drive_url;
  if (data.error_message !== undefined) update.error_message = data.error_message;

  const { data: result } = await svc
    .from("ugc_variants")
    .update(update)
    .eq("tenant_id", tenantId)
    .eq("id", variantId)
    .select(FIELDS)
    .single();
  return (result ?? null) as UgcVariant | null;
}

export async function bulkUpdateStatus(
  tenantId: string,
  variantIds: string[],
  status: string
): Promise<number> {
  const svc = createSupabaseService();
  const { data } = await svc
    .from("ugc_variants")
    .update({ status })
    .eq("tenant_id", tenantId)
    .in("id", variantIds)
    .select("id");
  return data?.length ?? 0;
}
