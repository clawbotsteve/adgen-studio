import { requireUserTenantPage } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { listClients } from "@/lib/data/clients";
import { listProfiles } from "@/lib/data/profiles";
import { listPromptPacks } from "@/lib/data/prompts";
import { listReferences } from "@/lib/data/references";
import { BatchWizard } from "@/components/batch/BatchWizard";

export const metadata = {
  title: "Smart Batch",
};

export default async function SmartBatchRoute() {
  const { tenant } = await requireUserTenantPage();
  const [clients, profiles, promptPacks, references] = await Promise.all([
    listClients(tenant.id),
    listProfiles(tenant.id),
    listPromptPacks(tenant.id),
    listReferences(tenant.id),
  ]);

  return (
    <BatchWizard
      clients={clients}
      profiles={profiles}
      promptPacks={promptPacks}
      references={references}
    />
  );
}
