import { requireUserTenantPage } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { listClients } from "@/lib/data/clients";
import { ClientGeneratorPage } from "@/components/client-generator/ClientGeneratorPage";

export default async function Page() {
  const { tenant } = await requireUserTenantPage();
  const clients = await listClients(tenant.id);

  return (
    <div className="page-container">
      <PageHeader
        title="Client Generator"
        description="Build a complete client profile to help the AI generate better content"
      />
      <ClientGeneratorPage initialClients={clients} />
    </div>
  );
}
