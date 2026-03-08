import { requireUserTenantPage } from "@/lib/auth";
import { listBrands, listJobs, listClients, listBatchRuns, countReferenceImages } from "@/lib/data";
import Link from "next/link";

export default async function DashboardPage() {
  const { tenant } = await requireUserTenantPage();
  const [brands, jobs, clients, batchRuns, imageCount] = await Promise.all([
    listBrands(tenant.id),
    listJobs(tenant.id, 50),
    listClients(tenant.id),
    listBatchRuns(tenant.id, 20),
    countReferenceImages(tenant.id),
  ]);

  const completedJobs = jobs.filter((j) => j.status === "completed").length;
  const failedJobs = jobs.filter((j) => j.status === "failed").length;
  const totalGenerations = completedJobs + batchRuns.reduce((sum, r) => sum + r.completed_count, 0);

  // Activity for last 7 days
  const today = new Date();
  const days: { label: string; date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayJobs = jobs.filter((j) => j.created_at.startsWith(dateStr)).length;
    const dayBatch = batchRuns.filter((r) => r.created_at.startsWith(dateStr))
      .reduce((sum, r) => sum + r.completed_count, 0);
    days.push({
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      date: dateStr,
      count: dayJobs + dayBatch,
    });
  }
  const maxActivity = Math.max(...days.map((d) => d.count), 1);

  // Recent batch runs (last 5)
  const recentBatches = batchRuns.slice(0, 5);

  // Quick stats for clients
  const activeClients = clients.length;

  return (
    <div className="dash-page">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Dashboard</h1>
          <p className="dash-subtitle">Welcome back â here&apos;s your creative overview</p>
        </div>
        <Link href="/batch/create" className="dash-cta-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          Generate
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="dash-stats">
        <div className="dash-stat-card">
          <div className="dash-stat-icon dash-stat-icon-blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="dash-stat-content">
            <span className="dash-stat-value">{activeClients}</span>
            <span className="dash-stat-label">Active Clients</span>
          </div>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-icon dash-stat-icon-green">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <div className="dash-stat-content">
            <span className="dash-stat-value">{totalGenerations}</span>
            <span className="dash-stat-label">Generations</span>
          </div>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-icon dash-stat-icon-purple">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div className="dash-stat-content">
            <span className="dash-stat-value">{imageCount}</span>
            <span className="dash-stat-label">Reference Images</span>
          </div>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-icon dash-stat-icon-orange">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div className="dash-stat-content">
            <span className="dash-stat-value">{batchRuns.length}</span>
            <span className="dash-stat-label">Batch Runs</span>
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="dash-grid">
        {/* Left column */}
        <div className="dash-col-main">
          {/* Activity Chart */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3>Generation Activity</h3>
              <span className="dash-card-badge">Last 7 days</span>
            </div>
            <div className="dash-chart">
              {days.map((day) => (
                <div key={day.date} className="dash-chart-bar-wrap">
                  <div className="dash-chart-count">{day.count}</div>
                  <div className="dash-chart-bar-bg">
                    <div
                      className="dash-chart-bar-fill"
                      style={{ height: `${(day.count / maxActivity) * 100}%` }}
                    />
                  </div>
                  <div className="dash-chart-label">{day.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Jobs */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3>Recent Jobs</h3>
              <span className="dash-card-badge">{jobs.length} total</span>
            </div>
            {jobs.length === 0 ? (
              <div className="dash-empty">
                <p>No jobs yet. Start generating!</p>
                <Link href="/batch/create" className="dash-empty-link">Go to Generate â</Link>
              </div>
            ) : (
              <div className="dash-table-wrap">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Prompt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.slice(0, 8).map((job) => (
                      <tr key={job.id}>
                        <td className="dash-table-date">
                          {new Date(job.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td>
                          <span className={`dash-status dash-status-${job.status}`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="dash-table-prompt">{job.prompt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="dash-col-side">
          {/* Quick Actions */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3>Quick Actions</h3>
            </div>
            <div className="dash-actions">
              <Link href="/batch/create" className="dash-action-item">
                <div className="dash-action-icon dash-action-icon-blue">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <div>
                  <span className="dash-action-title">Generate Creative</span>
                  <span className="dash-action-desc">Create new ad images</span>
                </div>
              </Link>
              <Link href="/smart-batch" className="dash-action-item">
                <div className="dash-action-icon dash-action-icon-purple">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <div>
                  <span className="dash-action-title">Smart Batch</span>
                  <span className="dash-action-desc">AI-powered batch generation</span>
                </div>
              </Link>
              <Link href="/clients" className="dash-action-item">
                <div className="dash-action-icon dash-action-icon-green">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <line x1="20" y1="8" x2="20" y2="14" />
                    <line x1="23" y1="11" x2="17" y2="11" />
                  </svg>
                </div>
                <div>
                  <span className="dash-action-title">Add Client</span>
                  <span className="dash-action-desc">Set up a new brand</span>
                </div>
              </Link>
              <Link href="/brand-context" className="dash-action-item">
                <div className="dash-action-icon dash-action-icon-orange">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </div>
                <div>
                  <span className="dash-action-title">Brand Context</span>
                  <span className="dash-action-desc">Define brand guidelines</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Batch Run Status */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3>Recent Batches</h3>
              <Link href="/history" className="dash-card-link">View all â</Link>
            </div>
            {recentBatches.length === 0 ? (
              <div className="dash-empty">
                <p>No batch runs yet</p>
              </div>
            ) : (
              <div className="dash-batch-list">
                {recentBatches.map((run) => {
                  const progress = run.total_items > 0
                    ? Math.round(((run.completed_count + run.failed_count) / run.total_items) * 100)
                    : 0;
                  return (
                    <div key={run.id} className="dash-batch-item">
                      <div className="dash-batch-top">
                        <span className={`dash-status dash-status-${run.status}`}>
                          {run.status}
                        </span>
                        <span className="dash-batch-date">
                          {new Date(run.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="dash-batch-stats">
                        <span>{run.completed_count} done</span>
                        {run.failed_count > 0 && (
                          <span className="dash-batch-failed">{run.failed_count} failed</span>
                        )}
                        <span>of {run.total_items}</span>
                      </div>
                      <div className="dash-progress-bar">
                        <div
                          className="dash-progress-fill"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Clients overview */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3>Clients</h3>
              <Link href="/clients" className="dash-card-link">Manage â</Link>
            </div>
            {clients.length === 0 ? (
              <div className="dash-empty">
                <p>No clients yet</p>
                <Link href="/clients" className="dash-empty-link">Add your first client â</Link>
              </div>
            ) : (
              <div className="dash-client-list">
                {clients.slice(0, 5).map((client) => (
                  <div key={client.id} className="dash-client-item">
                    <div className="dash-client-avatar">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="dash-client-info">
                      <span className="dash-client-name">{client.name}</span>
                      <span className="dash-client-date">
                        Added {new Date(client.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
