import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { listTopCreatives } from "@/lib/data/top-creatives";

/**
 * GET /api/top-creatives?clientId=...
 * Returns all top-creative reference images for a client.
 */
export async function GET(request: Request) {
  const auth = await requireUserTenantApi();
  if ("error" in auth)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed)
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");

  if (!clientId) {
    return NextResponse.json(
      { error: "Missing clientId query parameter" },
      { status: 400 }
    );
  }

  try {
    const creatives = await listTopCreatives(auth.tenant.id, clientId);
    return NextResponse.json({ creatives });
  } catch (error) {
    console.error("[top-creatives GET]", error);
    return NextResponse.json(
      { error: "Failed to list top creatives" },
      { status: 500 }
    );
  }
}
