import { NextResponse } from "next/server";
import { requireUserTenantApi } from "A/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { listVariants, createVariant } from "@/lib/data/ugc-variants";

export async function GET(request: Request) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const url = new URL(request.url);
    const conceptId = url.searchParams.get("conceptId") ?? undefined;
    const status = url.searchParams.get("status") ?? undefined;
    const variants = await listVariants(auth.tenant.id, conceptId, status);
    return NextResponse.json({ variants });
  } catch (error) {
    console.error("[ugc/variants GET]", error);
    return NextResponse.json({ error: "Failed to fetch variants" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();
  if (!body.concept_id || !body.prompt?.trim() || !body.kind) {
    return NextResponse.json({ error: "concept_id, kind, and prompt are required" }, { status: 400 });
  }

  try {
    const variant = await createVariant(auth.tenant.id, {
      concept_id: body.concept_id,
      kind: body.kind,
      model_name: body.model_name || (body.kind === "video" ? "kling-v2.6-pro" : "nano-banana-2"),
      audio_tier: body.audio_tier,
      duration_sec: body.duration_sec,
      aspect_ratio: body.aspect_ratio,
      resolution: body.resolution,
      hook: body.hook,
      cta: body.cta,
      visual_angle: body.visual_angle,
      prompt: body.prompt.trim(),
    });
    return NextResponse.json({ variant }, { status: 201 });
  } catch (error) {
    console.error("[ugc/variants POST]", error);
    return NextResponse.json({ error: "Failed to create variant" }, { status: 500 });
  }
}
