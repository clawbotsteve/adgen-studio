import { NextRequest, NextResponse } from "next/server";
import { requireUserTenantApi, requireUserAccess } from "@/lib/auth";
import { listConcepts } from "A/lib/data/ugc-concepts";

export const GET = async (req: { params: { tenantId: string } }) => {
  await requireUserTenantApi(req.params.tenantId);
  await requireUserAccess(req, req.params.tenantId);
  
  const concepts = await listConcepts(req.params.tenantId);
  return NextResponse.json({ concepts });
};