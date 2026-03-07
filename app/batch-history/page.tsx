import { requireUserTenantPage } from "@/lib/auth";
import { createSupabaseService } from "@/lib/supabase";
import { listClients } from "@/lib/data/clients";
import { PageHeader } from "@/components/layout/PageHeader";
import Link from "next/link";

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

  const grouped = (generations || []).reduce<Record<string, typeof generations>>((acc, gen) => {
    const name = clientMap.get(gen.client_id) || "Unknown";
    if (!acc[name]) acc[name] = [];
    acc[name].push(gen);
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
        clientNames.map((clientName) => (
          <div key={clientName} className="card" style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem", color: "#e2e8f0" }}>
              {clientName} ({grouped[clientName]!.length} generations)
            </h2>
            <div className="batch-history-grid">
              {grouped[clientName]!.map((gen) => (
                <div key={gen.id} className="batch-history-item">
                  <img src={gen.output_url} alt={gen.prompt} />
                  <div className="batch-history-meta">
                    <p className="batch-history-prompt">{gen.prompt}</p>
                    <span className="batch-history-details">
                      {gen.aspect_ratio} &middot; {gen.resolution} &middot; {new Date(gen.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
