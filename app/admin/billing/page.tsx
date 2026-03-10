import { requireUserTenantPage } from "@/lib/auth";
import { createSupabaseService } from "@/lib/supabase";
import { listClients } from "@/lib/data/clients";
import { PageHeader } from "@/components/layout/PageHeader";
import { BillingDashboard } from "@/components/admin/BillingDashboard";

export const metadata = {
  title: "Admin Billing",
};

// Pricing tiers per generation
const PRICING: Record<string, number> = {
  "1K": 0.45,
  "2K": 1.05,
  "4K": 2.85,
};

export default async function AdminBillingPage() {
  const { tenant } = await requireUserTenantPage();
  const svc = createSupabaseService();

  // Get all clients
  const clients = await listClients(tenant.id);
  const clientMap = new Map(clients.map((c) => [c.id, c.name]));

  // Get all completed batch item results with resolution, joined through batch_runs for client_id
  const { data: batchRuns } = await svc
    .from("batch_runs")
    .select("id, client_id, created_at")
    .eq("tenant_id", tenant.id);

  const runClientMap: Record<string, string> = {};
  const runDateMap: Record<string, string> = {};
  for (const run of batchRuns || []) {
    runClientMap[run.id] = run.client_id;
    runDateMap[run.id] = run.created_at;
  }

  // Get all completed items
  const { data: completedItems } = await svc
    .from("batch_item_results")
    .select("id, batch_run_id, resolution, completed_at, concept, output_url")
    .eq("status", "completed")
    .order("completed_at", { ascending: false });

  // Build per-client usage data
  const clientUsage: Record<
    string,
    {
      clientId: string;
      clientName: string;
      generations: { resolution: string; count: number; cost: number }[];
      totalCount: number;
      totalCost: number;
      items: {
        id: string;
        concept: string;
        resolution: string;
        cost: number;
        completedAt: string;
      }[];
    }
  > = {};

  for (const item of completedItems || []) {
    const clientId = runClientMap[item.batch_run_id];
    if (!clientId) continue;

    const clientName = clientMap.get(clientId) || "Unknown";
    const resolution = item.resolution || "2K";
    const cost = PRICING[resolution] || PRICING["2K"];

    if (!clientUsage[clientId]) {
      clientUsage[clientId] = {
        clientId,
        clientName,
        generations: [],
        totalCount: 0,
        totalCost: 0,
        items: [],
      };
    }

    clientUsage[clientId].totalCount++;
    clientUsage[clientId].totalCost += cost;
    clientUsage[clientId].items.push({
      id: item.id,
      concept: item.concept,
      resolution,
      cost,
      completedAt: item.completed_at || "",
    });

    // Update resolution breakdown
    const existing = clientUsage[clientId].generations.find(
      (g) => g.resolution === resolution
    );
    if (existing) {
      existing.count++;
      existing.cost += cost;
    } else {
      clientUsage[clientId].generations.push({
        resolution,
        count: 1,
        cost,
      });
    }
  }

  const usageData = Object.values(clientUsage);
  const grandTotal = usageData.reduce((sum, c) => sum + c.totalCost, 0);
  const grandCount = usageData.reduce((sum, c) => sum + c.totalCount, 0);

  // Serialize for client component
  const serializedData = {
    clients: usageData.map((c) => ({
      clientId: c.clientId,
      clientName: c.clientName,
      totalCount: c.totalCount,
      totalCost: c.totalCost,
      generations: c.generations,
      items: c.items,
    })),
    grandTotal,
    grandCount,
    pricing: PRICING,
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Admin Billing"
        description="Track usage and billing across all clients — for your eyes only"
      />
      <BillingDashboard data={serializedData} />
    </div>
  );
}
