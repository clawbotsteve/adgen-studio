import { NextResponse, type NextRequest } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { getBatchRun, listBatchOutputs } from "@/lib/data/batches";

export async function GET(
  _request: NextRequest,
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

  const url = new URL(_request.url);
  const statusFilter = url.searchParams.get("status") || undefined;

  const outputs = await listBatchOutputs(runId, statusFilter);
  return NextResponse.json({ outputs });
}
