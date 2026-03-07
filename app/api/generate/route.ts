import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { generateImage } from "@/lib/fal";

export async function POST(request: Request) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const body = (await request.json()) as {
      clientId?: string;
      prompt?: string;
      referenceImageUrl?: string;
    };

    if (!body.prompt?.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    if (!body.referenceImageUrl?.trim()) {
      return NextResponse.json({ error: "Reference image is required" }, { status: 400 });
    }

    // Call fal-ai to generate the image
    const outputUrl = await generateImage(
      body.prompt.trim(),
      body.referenceImageUrl.trim()
    );

    return NextResponse.json({ outputUrl }, { status: 200 });
  } catch (error) {
    console.error("[generate POST]", error);
    const message = error instanceof Error ? error.message : "Failed to generate image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
