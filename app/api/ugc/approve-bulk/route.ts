import { NextRequest, NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { updateVariantStatus } from "@/lib/data/ugc-variants";

export const POST = async (req: { body: ReadableStream }) => {
  await requireUserTenantApi();
  const { variantIds } = await req.json();
  for (const id of variantIds) {
    await updateVariantStatus(id, 'approved');
  }
  return NextResponse.json({ success: true, count: variantIds.length });
};