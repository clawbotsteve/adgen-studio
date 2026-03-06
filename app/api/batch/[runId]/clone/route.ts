import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { getBatchRun, cloneBatchRun } from "@/lib/data/batches";

interface RouteParams {
  params: Promise<{ runId: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
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
    const originalRun = await getBatchRun(auth.tenant.id, runId);

    if (!originalRun) {
      return NextResponse.json(
        { error: "Original batch run not found" },
        { status: 404 }
      );
    }

    const newRun = await cloneBatchRun(
      auth.tenant.id,
      runId,
      auth.user.id
    );

    if (!newRun) {
      return NextResponse.json(
        { error: "Failed to clone batch run" },
        { status: 500 }
      );
    }

    return NextResponse.json({ run: newRun }, { status: 201 });
  } catch (error) {
    console.error("[batch clone]", error);
    return NextResponse.json(
      { error: "Failed to clone batch run" },
      { status: 500 }
    );
  }
}
