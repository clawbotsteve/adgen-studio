import { requireUserTenantPage } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { listClients } from "@/lib/data/clients";
import { listProfiles } from "@/lib/data/profiles";
import { listPromptPacks } from "@/lib/data/prompts";
import { SmartBatchPage } from "@/components/smart-batch/SmartBatchPage";

export const metadata = {
  title: "Smart Batch",
};

export default async function SmartBatchRoute() {
  const { tenant } = await requireUserTenantPage();
  const [clients, profiles, promptPacks] = await Promise.all([
    listClients(tenant.id),
    listProfiles(tenant.id),
    listPromptPacks(tenant.id),
  ]);

  return (
    <div className="page-container">
      <PageHeader
        title="Smart Batch"
        description="Configure settings, upload reference photos, and generate ad batches."
      />
      <SmartBatchPage
        clients={clients}
        profiles={profiles}
        promptPacks={promptPacks}
      />
    </div>
  );
}
