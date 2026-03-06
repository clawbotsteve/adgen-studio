import { requireUserTenantPage } from "@/lib/auth";
import { listBrands, listJobs } from "@/lib/data";
import GenerateForm from "@/components/GenerateForm";

export default async function DashboardPage() {
  const { tenant } = await requireUserTenantPage();
  const [brands, jobs] = await Promise.all([listBrands(tenant.id), listJobs(tenant.id, 10)]);
  const completed = jobs.filter((j) => j.status === "completed").length;

  return (
    <div className="grid" style={{ gap: 20 }}>
      <div className="grid grid-3">
        <div className="card"><div className="badge">Tenant</div><h3>{tenant.name}</h3></div>
        <div className="card"><div className="badge">Brands</div><h3>{brands.length}</h3></div>
        <div className="card"><div className="badge">Completed jobs</div><h3>{completed}</h3></div>
      </div>
      <GenerateForm brands={brands} />
      <section className="card">
        <h3>Recent jobs</h3>
        <table className="table">
          <thead><tr><th>Created</th><th>Status</th><th>Prompt</th></tr></thead>
          <tbody>
            {jobs.map((job) => <tr key={job.id}><td>{new Date(job.created_at).toLocaleString()}</td><td>{job.status}</td><td>{job.prompt}</td></tr>)}
          </tbody>
        </table>
      </section>
    </div>
  );
}
