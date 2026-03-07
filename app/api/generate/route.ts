import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { generateImage } from "@/lib/fal";
import { createSupabaseService } from "@/lib/supabase";

export async function POST(request: Request) {
  const auth = await requireUserTenantApi();
  if ("error" in auth)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed)
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const body = (await request.json()) as {
      clientId?: string;
      prompt?: string;
      referenceImageUrl?: string;
      aspectRatio?: string;
      resolution?: string;
      batchId?: string;
    };

    if (!body.prompt?.trim())
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    if (!body.referenceImageUrl?.trim())
      return NextResponse.json({ error: "Reference image is required" }, { status: 400 });

    const outputUrl = await generateImage(
      body.prompt.trim(),
      body.referenceImageUrl.trim(),
      body.aspectRatio || "1:1",
      body.resolution || "1K"
    );

    // Save to generations table
    try {
      const supabase = createSupabaseService();
      await supabase.from("generations").insert({
        tenant_id: auth.tenant.id,
        client_id: body.clientId,
        prompt: body.prompt.trim(),
        reference_image_url: body.referenceImageUrl.trim(),
        output_url: outputUrl,
        aspect_ratio: body.aspectRatio || "1:1",
        resolution: body.resolution || "1K",
        batch_id: body.batchId || null,
      });
    } catch (saveErr) {
      console.error("[generate POST] Failed to save generation:", saveErr);
    }

    return NextResponse.json({ outputUrl }, { status: 200 });
  } catch (error) {
    console.error("[generate POST]", error);
    const message = error instanceof Error ? error.message : "Failed to generate image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
