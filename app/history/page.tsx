import { requireUserTenantPage } from "@/lib/auth";
import { listBatchRuns, listAllClientContent } from "@/lib/data/batches";
import { listClients } from "@/lib/data/clients";
import { getProfile } from "@/lib/data/profiles";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ContentGrid } from "@/components/history/ContentGrid";
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

  // Map batch_run_id -> client name for the content grid
  const runClientNameMap: Record<string, string> = {};
  for (const run of batchRuns) {
    runClientNameMap[run.id] = clientMap.get(run.client_id) || "Unknown";
  }

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

  // Serialize content items for the client component
  const contentItems = allContent.map((item) => ({
    id: item.id,
    batch_run_id: item.batch_run_id,
    concept: item.concept,
    output_url: item.output_url,
    completed_at: item.completed_at,
  }));

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

      {/* Generated Content Grid - Client Component with Download */}
      {contentItems.length > 0 && (
        <ContentGrid items={contentItems} clientNameMap={runClientNameMap} />
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
