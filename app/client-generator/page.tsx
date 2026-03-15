import { requireUserTenantPage } from "@/lib/auth";
import { listClients } from "@/lib/data/clients";
import { ClientGeneratorPage } from "@/components/client-generator/ClientGeneratorPage";

export default async function Page() {
  const { tenant } = await requireUserTenantPage();
  const clients = await listClients(tenant.id);
  return (
    <div className="page-container">
      <ClientGeneratorPage initialClients={clients} />
    </div>
  );
}
