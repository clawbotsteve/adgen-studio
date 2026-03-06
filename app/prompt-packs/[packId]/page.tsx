import { requireUserTenantPage } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { PromptItemEditor } from "@/components/prompts/PromptItemEditor";
import { PromptExportButton } from "@/components/prompts/PromptExportButton";
import { getPromptPack, listPromptItems } from "@/lib/data/prompts";

interface PromptPackDetailPageProps {
  params: Promise<{
    packId: string;
  }>;
}

export default async function PromptPackDetailPage({
  params,
}: PromptPackDetailPageProps) {
  const { packId } = await params;
  const { tenant } = await requireUserTenantPage();
  const [pack, items] = await Promise.all([
    getPromptPack(tenant.id, packId),
    listPromptItems(packId),
  ]);

  if (!pack) {
    return (
      <div className="page-container">
        <PageHeader title="Prompt Pack Not Found" />
        <div className="card">
          <p>The requested prompt pack could not be found.</p>
          <a href="/prompt-packs" className="button">
            Back to Prompt Packs
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title={pack.name}
        description={pack.description || undefined}
        actions={items.length > 0 ? <PromptExportButton items={items} packName={pack.name} /> : undefined}
      />

      <div style={{ display: "grid", gap: 24 }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Prompt Management</h3>
          <PromptItemEditor packId={packId} items={items} />
        </div>

        {pack.tags && pack.tags.length > 0 && (
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Tags</h3>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {pack.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    background: "#f0f0f0",
                    padding: "4px 12px",
                    borderRadius: 4,
                    fontSize: "0.875rem",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
