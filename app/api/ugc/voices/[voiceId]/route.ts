import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { updateVoice, deleteVoice } from "@/lib/data/ugc-voices";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ voiceId: string }> }
) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { voiceId } = await params;
    const body = await request.json();
    const voice = await updateVoice(auth.tenant.id, voiceId, body);
    if (!voice) return NextResponse.json({ error: "Voice not found" }, { status: 404 });
    return NextResponse.json({ voice });
  } catch (error) {
    console.error("[ugc/voices/:id PATCH]", error);
    return NextResponse.json({ error: "Failed to update voice" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ voiceId: string }> }
) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { voiceId } = await params;
    const ok = await deleteVoice(auth.tenant.id, voiceId);
    if (!ok) return NextResponse.json({ error: "Failed to delete voice" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ugc/voices/:id DELETE]", error);
    return NextResponse.json({ error: "Failed to delete voice" }, { status: 500 });
  }
}
