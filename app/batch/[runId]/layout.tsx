import Link from "next/link";
import { requireUserTenantPage } from "@/lib/auth";
import { getBatchRun } from "@/lib/data/batches";
import { notFound } from "next/navigation";

interface BatchLayoutProps {
  children: React.ReactNode;
  params: Promise<{ runId: string }>;
}

export default async function BatchLayout({
  children,
  params,
}: BatchLayoutProps) {
  const { tenant } = await requireUserTenantPage();
  const { runId } = await params;

  const batchRun = await getBatchRun(tenant.id, runId);

  if (!batchRun) {
    notFound();
  }

  return (
    <div className="page-container">
      <div className="batch-tabs">
        <Link href={`/batch/${runId}`} className="tab">
          Monitor
        </Link>
        <Link href={`/batch/${runId}/outputs`} className="tab">
          Outputs
        </Link>
        <Link href={`/batch/${runId}/review`} className="tab">
          Review
        </Link>
        <Link href={`/batch/${runId}/errors`} className="tab">
          Errors
        </Link>
      </div>
      {children}
    </div>
  );
}
