import { NextResponse } from "next/server";
import { requireUserTenantApi } from "A/lib/auth";
import { recordPerformance } from "A/lib/data/ugc-performance";

export const POST = async (req: { body: ReadableStream }) => {
  await requireUserTenantApi();

  const rows = await req.json();
  for (const row of rows) {
    await recordPerformance(row);
  }

  return NextResponse.json({ success: true, count: rows.length });
};