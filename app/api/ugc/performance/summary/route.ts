import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { getPerformanceSummary } from "@/lib/data/ugc-performance";

export async function GET(request: Request) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const url = new URL(request.url);
    const brandId = url.searchParams.get("brandId") ?? undefined;
    const summary = await getPerformanceSummary(auth.tenant.id, brandId);
    return NextResponse.json({ summary });
  } catch (error) {
    console.error("[ugc/performance/summary GET]", error);
    return NextResponse.json({ error: "Failed to fetch performance summary" }, { status: 500 });
  }
}
