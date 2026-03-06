import { requireUserTenantPage } from "@/lib/auth";
import { listBatchRuns } from "@/lib/data/batches";
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
  const batchRuns = await listBatchRuns(tenant.id, { limit: 100 });

  // Fetch client and profile names for each run
  const enrichedRuns = await Promise.all(
    batchRuns.map(async (run) => {
      const [client, profile] = await Promise.all([
        getClient(tenant.id, run.client_id),
        getProfile(tenant.id, run.profile_id),
      ]);
      return {
        ...run,
        clientName: client?.name || "Unknown",
        profileName: profile?.name || "Unknown",
      };
    })
  );

  const formatDuration = (startedAt: string | null, createdAt: string): string => {
    if (!startedAt) return "-";
    const start = new Date(startedAt).getTime();
    const created = new Date(createdAt).getTime();
    const seconds = Math.floor((start - created) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Run History"
        description="View and manage your batch runs"
        actions={
          <Link href="/batch/create" className="button">
            New Batch Run
          </Link>
        }
      />

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
                <th>Mode</th>
                <th>Profile</th>
                <th>Items</th>
                <th>Status</th>
                <th>Created</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {enrichedRuns.map((run) => (
                <tr key={run.id} className="cursor-pointer hover:bg-gray-50">
                  <td>
                    <Link href={`/batch/${run.id}`} className="link">
                      {run.id.slice(0, 8)}...
                    </Link>
                  </td>
                  <td>{run.clientName}</td>
                  <td>
                    {run.profile_id === run.profile_id
                      ? enrichedRuns.find((r) => r.id === run.id)?.profileName?.split("/")[0] || "?"
                      : "?"}
                  </td>
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
