import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { generateVideo } from "@/lib/fal";
import { createVariant, updateVariant } from "@/lib/data/ugc-variants";
import { computeKlingCost, computeClientCharge, computeMargin } from "@/lib/pricing";

export async function POST(request: Request) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();
  const { concept_id, prompt, image_url, duration, aspect_ratio, audio_tier, hook, cta, visual_angle } = body;

  if (!concept_id || !prompt?.trim()) {
    return NextResponse.json({ error: "concept_id and prompt are required" }, { status: 400 });
  }

  const durationSec = duration ?? 5;
  const tier = audio_tier ?? "no_audio";
  const ratio = aspect_ratio ?? "16:9";

  try {
    // Create variant record first
    const variant = await createVariant(auth.tenant.id, {
      concept_id,
      kind: "video",
      model_name: "kling-v2.6-pro",
      audio_tier: tier,
      duration_sec: durationSec,
      aspect_ratio: ratio,
      prompt: prompt.trim(),
      hook: hook ?? null,
      cta: cta ?? null,
      visual_angle: visual_angle ?? null,
    });

    // Update status to generating
    await updateVariant(auth.tenant.id, variant.id, { status: "generating" });

    // Generate video via fal-ai
    const result = await generateVideo({
      prompt: prompt.trim(),
      imageUrl: image_url,
      duration: durationSec,
      aspectRatio: ratio,
    });

    // Compute pricing
    const cost = computeKlingCost(durationSec, tier);
    const charge = computeClientCharge(cost);
    const margin = computeMargin(charge, cost);

    // Update variant with output
    const updated = await updateVariant(auth.tenant.id, variant.id, {
      status: "generated",
      output_url: result.videoUrl,
    });

    return NextResponse.json({
      variant: updated,
      pricing: { fal_cost_usd: cost, client_charge_usd: charge, margin_usd: margin },
    }, { status: 201 });
  } catch (error) {
    console.error("[ugc/videos/generate POST]", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Video generation failed",
    }, { status: 500 });
  }
}
