import { createSupabaseService } from "../supabase";
import type { BrandContext, BrandContextDoc } from "@/types/domain";

const CONTEXT_FIELDS =
  "id,tenant_id,client_id,brand_guidelines,products,competitive_landscape,customer_personas,founder_story,marketing_calendar,compliance_legal,testing_priorities,ad_format_preferences,creative_ops_constraints,naming_conventions,goals,created_at,updated_at";

const DOC_FIELDS =
  "id,tenant_id,brand_context_id,file_name,file_type,storage_url,file_size_bytes,upload_order,created_at";

export async function getBrandContext(
  tenantId: string,
  clientId: string
): Promise<BrandContext | null> {
  const svc = createSupabaseService();
  const { data } = await svc
    .from("brand_context")
    .select(CONTEXT_FIELDS)
    .eq("tenant_id", tenantId)
    .eq("client_id", clientId)
    .single();
  return (data ?? null) as BrandContext | null;
}

export async function upsertBrandContext(
  tenantId: string,
  clientId: string,
  fields: Partial<
    Omit<BrandContext, "id" | "tenant_id" | "client_id" | "created_at" | "updated_at">
  >
): Promise<BrandContext> {
  const svc = createSupabaseService();

  // Check if one already exists
  const existing = await getBrandContext(tenantId, clientId);

  if (existing) {
    const { data: result, error } = await svc
      .from("brand_context")
      .update({
        ...fields,
        updated_at: new Date().toISOString(),
      })
      .eq("tenant_id", tenantId)
      .eq("client_id", clientId)
      .select(CONTEXT_FIELDS)
      .single();
    if (error) throw new Error(`Failed to update brand context: ${error.message}`);
    return result as BrandContext;
  }

  const { data: result, error } = await svc
    .from("brand_context")
    .insert({
      tenant_id: tenantId,
      client_id: clientId,
      ...fields,
    })
    .select(CONTEXT_FIELDS)
    .single();
  if (error) throw new Error(`Failed to create brand context: ${error.message}`);
  return result as BrandContext;
}

export async function listBrandContextDocs(
  tenantId: string,
  brandContextId: string
): Promise<BrandContextDoc[]> {
  const svc = createSupabaseService();
  const { data } = await svc
    .from("brand_context_docs")
    .select(DOC_FIELDS)
    .eq("tenant_id", tenantId)
    .eq("brand_context_id", brandContextId)
    .order("upload_order", { ascending: true });
  return (data ?? []) as BrandContextDoc[];
}

export async function addBrandContextDoc(
  tenantId: string,
  brandContextId: string,
  doc: {
    file_name: string;
    file_type: string;
    storage_url: string;
    file_size_bytes: number | null;
  }
): Promise<BrandContextDoc> {
  const svc = createSupabaseService();

  // Get next upload_order
  const existing = await listBrandContextDocs(tenantId, brandContextId);
  const nextOrder = existing.length > 0 ? Math.max(...existing.map((d) => d.upload_order)) + 1 : 0;

  const { data: result, error } = await svc
    .from("brand_context_docs")
    .insert({
      tenant_id: tenantId,
      brand_context_id: brandContextId,
      file_name: doc.file_name,
      file_type: doc.file_type,
      storage_url: doc.storage_url,
      file_size_bytes: doc.file_size_bytes,
      upload_order: nextOrder,
    })
    .select(DOC_FIELDS)
    .single();
  if (error) throw new Error(`Failed to add brand context doc: ${error.message}`);
  return result as BrandContextDoc;
}

export async function deleteBrandContextDoc(
  tenantId: string,
  docId: string
): Promise<boolean> {
  const svc = createSupabaseService();
  const { error } = await svc
    .from("brand_context_docs")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", docId);
  return !error;
}

/**
 * Build a master context string from all non-null brand context fields.
 * This string gets prepended to prompts during batch generation.
 */
export async function buildMasterContextString(
  tenantId: string,
  clientId: string
): Promise<string> {
  const ctx = await getBrandContext(tenantId, clientId);
  if (!ctx) return "";

  const sections: string[] = [];

  const fieldMap: { label: string; key: keyof BrandContext }[] = [
    { label: "BRAND GUIDELINES", key: "brand_guidelines" },
    { label: "PRODUCTS & USPs", key: "products" },
    { label: "COMPETITIVE LANDSCAPE", key: "competitive_landscape" },
    { label: "TARGET PERSONAS", key: "customer_personas" },
    { label: "FOUNDER STORY", key: "founder_story" },
    { label: "MARKETING CALENDAR", key: "marketing_calendar" },
    { label: "COMPLIANCE & LEGAL", key: "compliance_legal" },
    { label: "TESTING PRIORITIES", key: "testing_priorities" },
    { label: "AD FORMAT PREFERENCES", key: "ad_format_preferences" },
    { label: "CREATIVE OPS CONSTRAINTS", key: "creative_ops_constraints" },
    { label: "NAMING CONVENTIONS", key: "naming_conventions" },
    { label: "GOALS", key: "goals" },
  ];

  for (const { label, key } of fieldMap) {
    const value = ctx[key];
    if (typeof value === "string" && value.trim()) {
      sections.push(`${label}:\n${value.trim()}`);
    }
  }

  if (sections.length === 0) return "";

  return `=== BRAND CONTEXT ===\n\n${sections.join("\n\n")}\n\n=== END BRAND CONTEXT ===`;
}
