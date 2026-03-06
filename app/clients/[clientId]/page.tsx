import { requireUserTenantPage } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { getClient } from "@/lib/data/clients";

interface ClientDetailPageProps {
  params: {
    clientId: string;
  };
}

export default async function ClientDetailPage({
  params,
}: ClientDetailPageProps) {
  const { tenant } = await requireUserTenantPage();
  const client = await getClient(tenant.id, params.clientId);

  if (!client) {
    return (
      <div className="page-container">
        <PageHeader title="Client Not Found" />
        <div className="card">
          <p>The requested client could not be found.</p>
          <a href="/clients" className="button">
            Back to Clients
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader title={client.name} />
      <div style={{ display: "grid", gap: 24 }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Client Details</h3>
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label style={{ fontWeight: 500 }}>Name</label>
              <p>{client.name}</p>
            </div>
            {client.description && (
              <div>
                <label style={{ fontWeight: 500 }}>Description</label>
                <p>{client.description}</p>
              </div>
            )}
            <div>
              <label style={{ fontWeight: 500 }}>Created</label>
              <p>
                {new Date(client.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
