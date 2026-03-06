import { requireUserTenantPage } from "@/lib/auth";
import { getBatchRun, listBatchOutputs } from "@/lib/data/batches";
import { notFound } from "next/navigation";
import { ReviewPageClient } from "./ReviewPageClient";

interface ReviewPageProps {
  params: Promise<{ runId: string }>;
}

export async function generateMetadata({ params }: ReviewPageProps) {
  const { runId } = await params;
  return { title: `Review - Batch ${runId}` };
}

export default async function BatchReviewPage({ params }: ReviewPageProps) {
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
          <h2>Review Outputs</h2>
          <p className="section-description">
            Browse and manage generated assets ({outputs.length} total)
          </p>
        </div>
      </div>

      <ReviewPageClient items={outputs} batchRunId={runId} />
    </div>
  );
}
