import { requireUserTenantPage } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { listClients } from "@/lib/data/clients";
import { BrandContextPage } from "@/components/brand-context/BrandContextPage";

export const metadata = {
  title: "Brand Context",
};

export default async function BrandContextRoute() {
  const { tenant } = await requireUserTenantPage();
  const clients = await listClients(tenant.id);

  return (
    <div className="page-container">
      <PageHeader
        title="Brand Context"
        description="Store brand guidelines, products, personas, and documents per client. This context is automatically injected into Smart Batch generations."
      />
      <BrandContextPage clients={clients} />
    </div>
  );
}
