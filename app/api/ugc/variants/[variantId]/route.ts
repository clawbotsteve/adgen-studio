import { NextRequest, NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { saveVariant } from "@/lib/data/ugc-variants";

export const PUT = async (req: { body: ReadableStream; params: { variantId: string } }) => {
  await requireUserTenantApi();
  const data = await req.json();
  await saveVariant({ ...data, id: req.params.variantId });
  return NextResponse.json({ success: true });
};