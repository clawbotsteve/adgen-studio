import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { getVariant, updateVariant } from "A/lib/data/ugc-variants";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ variantId: string }> }
) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { variantId } = await params;
    const variant = await getVariant(auth.tenant.id, variantId);
    if (!variant) return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    return NextResponse.json({ variant });
  } catch (error) {
    console.error("[ugc/variants/:id GET]", error);
    return NextResponse.json({ error: "Failed to fetch variant" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ variantId: string }> }
) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { variantId } = await params;
    const body = await request.json();
    const variant = await updateVariant(auth.tenant.id, variantId, body);
    if (!variant) return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    return NextResponse.json({ variant });
  } catch (error) {
    console.error("[ugc/variants/:id PATCH]", error);
    return NextResponse.json({ error: "Failed to update variant" }, { status: 500 });
  }
}
