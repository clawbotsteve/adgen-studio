import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { updateAvatar, deleteAvatar } from "@/lib/data/ugc-avatars";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ avatarId: string }> }
) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { avatarId } = await params;
    const body = await request.json();
    const avatar = await updateAvatar(auth.tenant.id, avatarId, body);
    if (!avatar) return NextResponse.json({ error: "Avatar not found" }, { status: 404 });
    return NextResponse.json({ avatar });
  } catch (error) {
    console.error("[ugc/avatars/:id PATCH]", error);
    return NextResponse.json({ error: "Failed to update avatar" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ avatarId: string }> }
) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { avatarId } = await params;
    const ok = await deleteAvatar(auth.tenant.id, avatarId);
    if (!ok) return NextResponse.json({ error: "Failed to delete avatar" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ugc/avatars/:id DELETE]", error);
    return NextResponse.json({ error: "Failed to delete avatar" }, { status: 500 });
  }
}
