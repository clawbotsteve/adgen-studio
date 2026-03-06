import { requireUserTenantPage } from "@/lib/auth";
import { getBatchRun } from "@/lib/data/batches";
import { BatchMonitor } from "@/components/batch/BatchMonitor";
import { PageHeader } from "@/components/layout/PageHeader";
import Link from "next/link";
import { notFound } from "next/navigation";

interface BatchPageProps {
  params: Promise<{ runId: string }>;
}

export async function generateMetadata({ params }: BatchPageProps) {
  const { runId } = await params;
  return { title: `Batch Run ${runId}` };
}

export default async function BatchPage({ params }: BatchPageProps) {
  const { tenant } = await requireUserTenantPage();
  const { runId } = await params;

  const batchRun = await getBatchRun(tenant.id, runId);

  if (!batchRun) {
    notFound();
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Batch Monitor"
        actions={
          <Link href="/history" className="button button-secondary">
            Back to History
          </Link>
        }
      />
      <BatchMonitor runId={runId} />
    </div>
  );
}
