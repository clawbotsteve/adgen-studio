import { createSupabaseService } from "../supabase";
import type { UgcPerformance } from "@/types/ugc";

export async function getPerformanceSummary(
  tenantId: string,
  brandId?: string
): Promise<{
  totalImpressions: number;
  totalClicks: number;
  avgCtr: number;
  totalSpend: number;
  avgCpa: number;
  avgRoas: number;
  records: UgcPerformance[];
}> {
  const svc = createSupabaseService();
  let query = svc
    .from("ugc_performance")
    .select("id,tenant_id,variant_id,platform,campaign_name,impressions,clicks,ctr,spend_usd,cpa_usd,roas,captured_at")
    .eq("tenant_id", tenantId);

  // If brandId is provided, we need to join through ugc_variants → ugc_concepts
  // For now, return all tenant performance data
  const { data } = await query.order("captured_at", { ascending: false });
  const records = (data ?? []) as UgcPerformance[];

  const totalImpressions = records.reduce((sum, r) => sum + (r.impressions ?? 0), 0);
  const totalClicks = records.reduce((sum, r) => sum + (r.clicks ?? 0), 0);
  const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
  const totalSpend = records.reduce((sum, r) => sum + (r.spend_usd ?? 0), 0);
  const avgCpa = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const roasValues = records.filter((r) => r.roas != null).map((r) => r.roas!);
  const avgRoas = roasValues.length > 0 ? roasValues.reduce((a, b) => a + b, 0) / roasValues.length : 0;

  return { totalImpressions, totalClicks, avgCtr, totalSpend, avgCpa, avgRoas, records };
}

export async function importPerformanceData(
  tenantId: string,
  rows: Array<{
    variant_id: string;
    platform?: string;
    campaign_name?: string;
    impressions?: number;
    clicks?: number;
    ctr?: number;
    spend_usd?: number;
    cpa_usd?: number;
    roas?: number;
  }>
): Promise<number> {
  const svc = createSupabaseService();
  const insertRows = rows.map((r) => ({
    tenant_id: tenantId,
    variant_id: r.variant_id,
    platform: r.platform ?? null,
    campaign_name: r.campaign_name ?? null,
    impressions: r.impressions ?? 0,
    clicks: r.clicks ?? 0,
    ctr: r.ctr ?? null,
    spend_usd: r.spend_usd ?? null,
    cpa_usd: r.cpa_usd ?? null,
    roas: r.roas ?? null,
  }));

  const { data, error } = await svc
    .from("ugc_performance")
    .insert(insertRows)
    .select("id");

  if (error) throw new Error(`Failed to import performance data: ${error.message}`);
  return data?.length ?? 0;
}
