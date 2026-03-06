import { NextResponse } from "next/server";
import { requireUserTenantApi } from "A/lib/auth";
import { assertTenantUser } from "A/lib/access";
import { getProfile, updateProfile, deleteProfile } from "A/lib/data/profiles";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const profileId = params.id;
  const body = (await request.json()) as Partial<{ name: string; mode: 'image' | 'video'; endpoint: string; aspect_ratio: string; resolution: string; duration_seconds: number | null; audio_enabled: boolean; seed: number | null; prompt_prefix: string | null; prompt_suffix: string | null; cost_estimate_cents: number | null }>;

  try {
    const profile = await updateProfile(auth.tenant.id, profileId, body);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    return NextResponse.json({ profile });
  } catch (error) {
    console.error("[profiles PATCH]", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const profileId = params.id;

  try {
    // Verify profile exists and belongs to tenant
    const profile = await getProfile(auth.tenant.id, profileId);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const success = await deleteProfile(auth.tenant.id, profileId);
    if (!success) {
      return NextResponse.json({ error: "Failed to delete profile" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[profiles DELETE]", error);
    return NextResponse.json({ error: "Failed to delete profile" }, { status: 500 });
  }
}
