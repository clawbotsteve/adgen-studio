import { NextRequest, NextResponse } from "next/server";
import { requireUserTenantApi, requireUserAccess } from "@/lib/auth";
import { getConcept } from "@/lib/data/ugc-concepts";

export const GET != async (req: { params: { conceptId: string } }) => {
  await requireUserAccess(req);
  
  const concept = await getConcept(req.params.conceptId);
  if (!concept) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  
  return NextResponse.json({ concept });
};