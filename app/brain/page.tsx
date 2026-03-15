import { requireUserTenantPage } from "@/lib/auth";
import { listClients } from "@/lib/data/clients";
import { BrainPage } from "@/components/brain/BrainPage";

export const metadata = {
  title: "Brain",
};

export default async function BrainRoute() {
  const { tenant } = await requireUserTenantPage();
  const clients = await listClients(tenant.id);

  return (
    <div className="page-container">
      <BrainPage clients={clients} />
    </div>
  );
}
