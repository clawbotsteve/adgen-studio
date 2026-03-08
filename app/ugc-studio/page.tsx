import { requireUserTenantPage } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { UgcStudioPage } from "@/components/ugc/UgcStudioPage";
import { listClients } from "@/lib/data/clients";

export default async function UgcStudioRoute() {
  const { tenant } = await requireUserTenantPage();
  const clients = await listClients(tenant.id);

  return (
    <div className="page-container">
      <PageHeader
        title="UGC Studio"
        description="Create, manage, and distribute UGC video content"
      />
      <UgcStudioPage clients={clients} />
    </div>
  );
}
