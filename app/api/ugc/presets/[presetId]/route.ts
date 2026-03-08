import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { updatePreset, deletePreset } from "@/lib/data/ugc-presets";

export async function PATCH(request: Request, { params }: { params: Promise<{ presetId: string }> }) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    const { presetId } = await params;
    const body = await request.json();
    const preset = await updatePreset(auth.tenant.id, presetId, body);
    if (!preset) return NextResponse.json({ error: "Preset not found" }, { status: 404 });
    return NextResponse.json({ preset });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update preset" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ presetId: string }> }) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    const { presetId } = await params;
    const ok = await deletePreset(auth.tenant.id, presetId);
    if (!ok) return NextResponse.json({ error: "Failed to delete preset" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete preset" }, { status: 500 });
  }
}
