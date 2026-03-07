import { requireUserTenantPage } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { ClientHubPage } from "@/components/generate/ClientHubPage";
import { listClients } from "@/lib/data/clients";

export const metadata = { title: "Client Profiles" };

export default async function ProfilesPage() {
  const { tenant } = await requireUserTenantPage();
  const clients = await listClients(tenant.id);

  return (
    <div className="page-container">
      <PageHeader
        title="Client Profiles"
        description="View and manage your clients creative operations"
      />
      <ClientHubPage clients={clients} />
    </div>
  );
}