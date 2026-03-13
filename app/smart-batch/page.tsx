import { requireUserTenantPage } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { listClients } from "@/lib/data/clients";
import { listProfiles } from "@/lib/data/profiles";
import { SmartBatchPage } from "@/components/smart-batch/SmartBatchPage";

export const metadata = {
  title: "Smart Batch",
};

export default async function SmartBatchRoute() {
  const { tenant } = await requireUserTenantPage();
  const [clients, profiles] = await Promise.all([
    listClients(tenant.id),
    listProfiles(tenant.id),
  ]);

  return (
    <div className="page-container">
      <PageHeader
        title="Smart Batch"
        description="Generate ad creatives from your client's brand context and reference images."
      />
      <SmartBatchPage
        clients={clients}
        profiles={profiles}
      />
    </div>
  );
}
