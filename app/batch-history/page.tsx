import { requireUserTenantPage } from "@/lib/auth";
import { createSupabaseService } from "@/lib/supabase";
import { listClients } from "@/lib/data/clients";
import { PageHeader } from "@/components/layout/PageHeader";
import Link from "next/link";
import BatchHistoryGrid from "@/components/generate/BatchHistoryGrid";

export const metadata = { title: "Batch History" };

export default async function BatchHistoryPage() {
  const { tenant } = await requireUserTenantPage();
  const supabase = createSupabaseService();
  const clients = await listClients(tenant.id);

  const { data: generations } = await supabase
    .from("generations")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false })
    .limit(200);

  const clientMap = new Map(clients.map((c) => [c.id, c.name]));

  const grouped = (generations || []).reduce<Record<string, any[]>>((acc, gen) => {
    const name = clientMap.get(gen.client_id) || "Unknown";
    if (!acc[name]) acc[name] = [];
    acc[name].push({
      id: gen.id,
      output_url: gen.output_url,
      prompt: gen.prompt,
      aspect_ratio: gen.aspect_ratio,
      resolution: gen.resolution,
      created_at: gen.created_at,
    });
    return acc;
  }, {});

  const clientNames = Object.keys(grouped).sort();

  return (
    <div className="page-container">
      <PageHeader
        title="Batch History"
        description="View all generated images organized by client"
        actions={<Link href="/batch/create" className="button">New Generation</Link>}
      />

      {clientNames.length === 0 ? (
        <div className="card">
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <p>No generations yet. Create one to get started.</p>
            <Link href="/batch/create" className="button" style={{ marginTop: "1rem" }}>
              Generate Your First Image
            </Link>
          </div>
        </div>
      ) : (
        <BatchHistoryGrid grouped={grouped} clientNames={clientNames} />
      )}
    </div>
  );
}