import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { importPerformanceData } from "@/lib/data/ugc-performance";

export async function POST(request: Request) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();
  const { rows } = body;

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "rows array is required" }, { status: 400 });
  }

  try {
    const count = await importPerformanceData(auth.tenant.id, rows);
    return NextResponse.json({ imported: count });
  } catch (error) {
    console.error("[ugc/performance/import POST]", error);
    return NextResponse.json({ error: "Failed to import performance data" }, { status: 500 });
  }
}
