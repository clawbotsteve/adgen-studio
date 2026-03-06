import { requireUserTenantPage } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { ReferenceUpload } from "@/components/references/ReferenceUpload";
import { ReferenceGrid } from "@/components/references/ReferenceGrid";
import { listReferences } from "@/lib/data/references";
import { listClients } from "@/lib/data/clients";

export default async function ReferencesPage() {
  const { tenant } = await requireUserTenantPage();
  const [references, clients] = await Promise.all([
    listReferences(tenant.id),
    listClients(tenant.id),
  ]);

  return (
    <div className="page-container">
      <PageHeader
        title="Reference Images"
        description="Upload and manage reference images for your clients"
      />
      <div style={{ display: "grid", gap: 24 }}>
        <ReferenceUpload clients={clients} />
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Reference Library</h3>
          <ReferenceGrid references={references} />
        </div>
      </div>
    </div>
  );
}
