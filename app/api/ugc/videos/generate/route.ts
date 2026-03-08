import { NextRequest, NextResponse } from "next/server";
import { client } from "@/lib/fal";
import { requireUserTenantApi } from "@/lib/auth";

export const POST = async (req: { body: ReadableStream }) => {
  await requireUserTenantApi();
  const variant = await req.json();
  const result = await client.queue({ 
    # see the fal-sdk docs for all available deque: {}}
    prompt: variant.prompt,
  });
  return NextResponse.json({ result });
};