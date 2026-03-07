import { createSupabaseService } from "@/lib/supabase";

export interface ClientStats {
  totalCount: number;
  thisMonthCount: number;
  referenceImageCount: number;
  lastGeneratedAt: string | null;
}

export interface RecentGeneration {
  id: string;
  prompt: string;
  output_url: string;
  aspect_ratio: string;
  resolution: string;
  created_at: string;
}

export async function getClientStats(tenantId: string, clientId: string): Promise<ClientStats> {
  const supabase = createSupabaseService();

  // Total generations count
  const { count: totalCount } = await supabase
    .from("generations")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("client_id", clientId);

  // This month count
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { count: thisMonthCount } = await supabase
    .from("generations")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("client_id", clientId)
    .gte("created_at", firstOfMonth);

  // Reference image count
  const { count: referenceImageCount } = await supabase
    .from("reference_images")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("client_id", clientId);

  // Last generated timestamp
  const { data: lastGen } = await supabase
    .from("generations")
    .select("created_at")
    .eq("tenant_id", tenantId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1);

  return {
    totalCount: totalCount ?? 0,
    thisMonthCount: thisMonthCount ?? 0,
    referenceImageCount: referenceImageCount ?? 0,
    lastGeneratedAt: lastGen?.[0]?.created_at ?? null,
  };
}

export async function getRecentGenerations(
  tenantId: string,
  clientId: string,
  limit = 12
): Promise<RecentGeneration[]> {
  const supabase = createSupabaseService();

  const { data } = await supabase
    .from("generations")
    .select("id, prompt, output_url, aspect_ratio, resolution, created_at")
    .eq("tenant_id", tenantId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as RecentGeneration[];
}