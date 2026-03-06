import { requireUserTenantPage } from "@/lib/auth";
import { listJobs } from "@/lib/data";
import CsvExportButton from "@/components/CsvExportButton";

export default async function HistoryPage() {
  const { tenant } = await requireUserTenantPage();
  const jobs = await listJobs(tenant.id, 500);

  return (
    <section className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3>Generation history</h3>
        <CsvExportButton rows={jobs} />
      </div>
      <table className="table">
        <thead><tr><th>Created</th><th>Status</th><th>Prompt</th><th>Output</th></tr></thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id}>
              <td>{new Date(job.created_at).toLocaleString()}</td>
              <td>{job.status}</td>
              <td>{job.prompt}</td>
              <td>{job.output_url ? <a href={job.output_url} target="_blank">Open</a> : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
