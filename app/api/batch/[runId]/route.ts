import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { getBatchRun } from "@/lib/data/batches";

interface RouteParams {
  params: Promise<{ runId: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { runId } = await params;

  try {
    const batchRun = await getBatchRun(auth.tenant.id, runId);

    if (!batchRun) {
      return NextResponse.json({ error: "Batch run not found" }, { status: 404 });
    }

    return NextResponse.json({ run: batchRun });
  } catch (error) {
    console.error("[batch GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch batch run" },
      { status: 500 }
    );
  }
}
