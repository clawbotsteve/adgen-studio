import { requireUserTenantPage } from "@/lib/auth";
import { listClients } from "@/lib/data/clients";
import { BatchGeneratePage } from "@/components/generate/BatchGeneratePage";

export const metadata = { title: "Batch Generate" };

export default async function BatchGenerateRoute() {
  const { tenant } = await requireUserTenantPage();
  const clients = await listClients(tenant.id);
  return <BatchGeneratePage clients={clients} />;
}
