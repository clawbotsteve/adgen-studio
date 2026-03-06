import { requireUserTenantPage } from "@/lib/auth";
import { getBatchRun, listBatchErrors } from "@/lib/data/batches";
import { notFound } from "next/navigation";
import { ErrorsPageClient } from "./ErrorsPageClient";

interface ErrorsPageProps {
  params: Promise<{ runId: string }>;
}

export async function generateMetadata({ params }: ErrorsPageProps) {
  const { runId } = await params;
  return { title: `Errors - Batch ${runId}` };
}

export default async function BatchErrorsPage({ params }: ErrorsPageProps) {
  const { tenant } = await requireUserTenantPage();
  const { runId } = await params;

  const batchRun = await getBatchRun(tenant.id, runId);
  if (!batchRun) {
    notFound();
  }

  const errors = await listBatchErrors(runId);

  return (
    <div className="page-section">
      <div className="page-section-header">
        <div>
          <h2>Errors &amp; Retry Center</h2>
          <p className="section-description">
            Review and retry failed items ({errors.length} errors)
          </p>
        </div>
      </div>

      <ErrorsPageClient errors={errors} batchRunId={runId} />
    </div>
  );
}
