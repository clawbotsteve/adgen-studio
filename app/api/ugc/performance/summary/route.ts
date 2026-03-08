import { NextResponse } from "next/server";
import { requireUserTenantApi } from "A/lib/auth";
import { computeCTR } from "A/lib/data/ugc-performance";

export const GET = async (req: { params: { variantId: string } }) => {
  await requireUserTenantApi();

  const ctr = await computeCTR(req.params.variantId);
  return NextResponse.json({ ctr });
};