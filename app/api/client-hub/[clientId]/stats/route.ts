import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { getClientStats, getRecentGenerations } from "@/lib/data/generations";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const auth = await requireUserTenantApi();
    if ("status" in auth) return auth;
    await assertTenantUser(auth.user.id, auth.tenant.id);

    const { clientId } = await params;
    if (!clientId) {
      return NextResponse.json({ error: "Client ID required" }, { status: 400 });
    }

    const [stats, recentGenerations] = await Promise.all([
      getClientStats(auth.tenant.id, clientId),
      getRecentGenerations(auth.tenant.id, clientId, 12),
    ]);

    return NextResponse.json({
      stats: {
        ...stats,
        recentGenerations,
      },
    });
  } catch (err) {
    console.error("[client-hub stats GET]", err);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}