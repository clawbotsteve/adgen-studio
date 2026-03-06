import { requireUserTenantPage } from "@/lib/auth";
import { getBatchRun, listBatchOutputs } from "@/lib/data/batches";
import { notFound } from "next/navigation";
import { OutputsPageClient } from "./OutputsPageClient";

interface OutputsPageProps {
  params: Promise<{ runId: string }>;
}

export async function generateMetadata({ params }: OutputsPageProps) {
  const { runId } = await params;
  return { title: `Outputs - Batch ${runId}` };
}

export default async function BatchOutputsPage({ params }: OutputsPageProps) {
  const { tenant } = await requireUserTenantPage();
  const { runId } = await params;

  const batchRun = await getBatchRun(tenant.id, runId);
  if (!batchRun) {
    notFound();
  }

  const outputs = await listBatchOutputs(runId);

  return (
    <div className="page-section">
      <div className="page-section-header">
        <div>
          <h2>Batch Outputs</h2>
          <p className="section-description">
            Generated outputs from this batch run ({outputs.length} items)
          </p>
        </div>
      </div>

      <OutputsPageClient items={outputs} batchRunId={runId} />
    </div>
  );
}
