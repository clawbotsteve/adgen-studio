import { NextResponse } from "next/server";
import { requireUserTenantApi } from "A/lib/auth";
import { assertTenantUser } from "A/lib/access";
import { getVariant, updateVariantStatus } from "A/lib/data/ugc-variants";

export const POST = async (req: { params: { tenantId: string; variantId: string } } ) => {
  await requireUserTenantApi(req.params.tenantId);
  await assertTenantUser(req, req.params.tenantId);

  const variant = await getVariant(req.params.variantId);
  if (!variant) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Trigger distribution logic here
  await updateVariantStatus(req.params.variantId, 'launched');

  return NextResponse.json({ success: true });
};