import { requireUserTenantPage } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { PromptPackForm } from "@/components/prompts/PromptPackForm";
import { PromptPackTable } from "@/components/prompts/PromptPackTable";
import { listPromptPacks } from "@/lib/data/prompts";

export default async function PromptPacksPage() {
  const { tenant } = await requireUserTenantPage();
  const packs = await listPromptPacks(tenant.id);

  return (
    <div className="page-container">
      <PageHeader
        title="Prompt Packs"
        description="Create and manage collections of prompts for batch generation"
      />
      <div style={{ display: "grid", gap: 24 }}>
        <PromptPackForm />
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Prompt Packs</h3>
          <PromptPackTable packs={packs} />
        </div>
      </div>
    </div>
  );
}
