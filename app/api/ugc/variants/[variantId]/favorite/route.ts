import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { toggleFavorite } from "@/lib/data/ugc-favorites";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ variantId: string }> }
) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { variantId } = await params;
    const result = await toggleFavorite(auth.tenant.id, auth.user.id, variantId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[ugc/variants/:id/favorite POST]", error);
    return NextResponse.json({ error: "Failed to toggle favorite" }, { status: 500 });
  }
}
