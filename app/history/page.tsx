import { requireUserTenantPage } from "@/lib/auth";
import { listBatchRuns, listAllClientContent } from "@/lib/data/batches";
import { listClients } from "@/lib/data/clients";
import { getClient } from "@/lib/data/clients";
import { getProfile } from "@/lib/data/profiles";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";

export const metadata = {
  title: "Run History",
};

export default async function HistoryPage() {
  const { tenant } = await requireUserTenantPage();
  const [batchRuns, allContent, clients] = await Promise.all([
    listBatchRuns(tenant.id, { limit: 100 }),
    listAllClientContent(tenant.id),
    listClients(tenant.id),
  ]);

  // Build client name map for quick lookup
  const clientMap = new Map(clients.map((c) => [c.id, c.name]));

  // Fetch client and profile names for each run
  const enrichedRuns = await Promise.all(
    batchRuns.map(async (run) => {
      const profile = await getProfile(tenant.id, run.profile_id);
      return {
        ...run,
        clientName: clientMap.get(run.client_id) || "Unknown",
        profileName: profile?.name || "Unknown",
      };
    })
  );

  // Map content to batch runs for client name lookup
  const runClientMap = new Map(batchRuns.map((r) => [r.id, r.client_id]));

  const formatDuration = (startedAt: string | null, createdAt: string): string => {
    if (!startedAt) return "-";
    const start = new Date(startedAt).getTime();
    const created = new Date(createdAt).getTime();
    const diff = Math.abs(start - created);
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Run History"
        description="View all batch runs and generated content across all clients"
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/batch/generate" className="button button-secondary">
              Batch Generate
            </Link>
            <Link href="/batch/create" className="button">
              New Generation
            </Link>
          </div>
        }
      />

      {/* Generated Content Grid */}
      {allContent.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 12, color: "var(--text-primary)" }}>
            Recent Generated Content ({allContent.length})
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 12,
            }}
          >
            {allContent.slice(0, 20).map((item) => {
              const cId = runClientMap.get(item.batch_run_id);
              const cName = cId ? clientMap.get(cId) : "Unknown";
              return (
                <div key={item.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
                  {item.output_url ? (
                    <div style={{ position: "relative" }}>
                      <img
                        src={item.output_url}
                        alt={item.concept}
                        style={{
                          width: "100%",
                          height: 160,
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        height: 160,
                        background: "var(--bg-secondary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-muted)",
                        fontSize: "0.85rem",
                      }}
                    >
                      No preview
                    </div>
                  )}
                  <div style={{ padding: "8px 12px" }}>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 500,
                        color: "var(--text-primary)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.concept}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                        marginTop: 2,
                      }}
                    >
                      {cName} · {item.completed_at ? new Date(item.completed_at).toLocaleDateString() : "-"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Batch Runs Table */}
      <h3 style={{ marginBottom: 12, color: "var(--text-primary)" }}>
        Batch Runs
      </h3>
      {batchRuns.length === 0 ? (
        <div className="card">
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <p>No batch runs yet. Create one to get started.</p>
            <Link href="/batch/create" className="button" style={{ marginTop: "1rem" }}>
              Create First Batch Run
            </Link>
          </div>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Run ID</th>
                <th>Client</th>
                <th>Profile</th>
                <th>Items</th>
                <th>Status</th>
                <th>Created</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {enrichedRuns.map((run) => (
                <tr key={run.id}>
                  <td>
                    <Link href={`/batch/${run.id}`} className="link">
                      {run.id.slice(0, 8)}...
                    </Link>
                  </td>
                  <td>{run.clientName}</td>
                  <td>{run.profileName}</td>
                  <td>{run.total_items}</td>
                  <td>
                    <StatusBadge status={run.status} />
                  </td>
                  <td>{new Date(run.created_at).toLocaleString()}</td>
                  <td>{formatDuration(run.started_at, run.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
