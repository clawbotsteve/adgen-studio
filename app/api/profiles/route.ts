import { NextResponse } from "next/server";
import { requireUserTenantApi } from "A/lib/auth";
import { assertTenantUser } from "A/lib/access";
import { listProfiles, createProfile } from "A/lib/data/profiles";

export async function GET() {
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const profiles = await listProfiles(auth.tenant.id);
    return NextResponse.json({ profiles });
  } catch (error) {
    console.error("[profiles GET]", error);
    return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  interface ProfileBody {
    name?: string;
    mode?: string;
    endpoint?: string;
    aspect_ratio?: string;
    resolution?: string;
    duration_seconds?: number | null;
    audio_enabled?: boolean;
    seed?: number | null;
    prompt_prefix?: string | null;
    prompt_suffix?: string | null;
    cost_estimate_cents?: number | null;
  }
  COnst body = (await request.json()) as ProfileBody;

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Profile name is required" }, { status: 400 });
  }
  if (!body.mode || !["image", "video"].includes(body.mode)) {
    return NextResponse.json({ error: "Valid mode (image/video) is required" }, { status: 400 });
  }
  if (!body.endpoint?.trim()) {
    return NextResponse.json({ error: "Endpoint is required" }, { status: 400 });
  }

  try {
    const profile = await createProfile(auth.tenant.id, {
      name: body.name.trim(),
      mode: body.mode as "image" | "video",
      endpoint: body.endpoint.trim(),
      aspect_ratio: body.aspect_ratio || "1:1",
      resolution: body.resolution || "1024x1024",
      duration_seconds: body.duration_seconds ?? null,
      audio_enabled: body.audio_enabled ?? false,
      seed: body.seed ?? null,
      prompt_prefix: body.prompt_prefix ?? null,
      prompt_suffix: body.prompt_suffix ?? null,
      cost_estimate_cents: body.cost_estimate_cents ?? null,
    });
    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    console.error("[profiles POST]", error);
    return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
  }
}
