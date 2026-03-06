import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { getBatchRun, listBatchErrors } from "@/lib/data/batches";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  const result = await requireUserTenantApi();
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  const { runId } = await params;
  const { tenant } = result;

  const batchRun = await getBatchRun(tenant.id, runId);
  if (!batchRun) {
    return NextResponse.json({ error: "Batch run not found" }, { status: 404 });
  }

  const errors = await listBatchErrors(runId);
  return NextResponse.json({ errors });
}
