import { requireUserTenantPage } from "@/lib/auth";
import { listClients } from "@/lib/data/clients";
import { GeneratePage } from "@/components/generate/GeneratePage";

export const metadata = {
  title: "Generate",
};

export default async function BatchCreatePage() {
  const { tenant } = await requireUserTenantPage();

  const clients = await listClients(tenant.id);

  return (
    <div className="page-container">
      <GeneratePage clients={clients} />
    </div>
  );
}
