import { requireUserTenantPage } from "@/lib/auth";
import { listClients } from "@/lib/data/clients";
import { listProfiles } from "@/lib/data/profiles";
import { listPromptPacks } from "@/lib/data/prompts";
import { listReferences } from "@/lib/data/references";
import { BatchWizard } from "@/components/batch/BatchWizard";

export const metadata = {
  title: "Create Batch Run",
};

export default async function BatchCreatePage() {
  const { tenant } = await requireUserTenantPage();

  const [clients, profiles, promptPacks, references] = await Promise.all([
    listClients(tenant.id),
    listProfiles(tenant.id),
    listPromptPacks(tenant.id),
    listReferences(tenant.id),
  ]);

  return (
    <div className="page-container">
      <BatchWizard
        clients={clients}
        profiles={profiles}
        promptPacks={promptPacks}
        references={references}
      />
    </div>
  );
}
