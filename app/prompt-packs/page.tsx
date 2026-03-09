import { requireUserTenantPage } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { PromptPacksPage } from "@/components/prompts/PromptPacksPage";
import { listPromptPacks } from "@/lib/data/prompts";

export default async function PromptPacksRoute() {
  const { tenant } = await requireUserTenantPage();
  const packs = await listPromptPacks(tenant.id);

  return (
    <div className="page-container">
      <PageHeader
        title="Prompt Packs"
        description="Build collections of prompts for batch generation"
      />
      <PromptPacksPage packs={packs} />
    </div>
  );
}
