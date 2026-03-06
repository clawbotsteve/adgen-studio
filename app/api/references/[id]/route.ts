import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { deleteReference, setPrimaryReference } from "@/lib/data/references";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const success = await deleteReference(auth.tenant.id, id);
    if (!success) {
      return NextResponse.json({ error: "Reference not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[references DELETE]", error);
    return NextResponse.json({ error: "Failed to delete reference" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = (await request.json()) as { is_primary?: boolean; client_id?: string };

  if (body.is_primary && body.client_id) {
    try {
      const success = await setPrimaryReference(
        auth.tenant.id,
        body.client_id,
        id
      );
      if (!success) {
        return NextResponse.json({ error: "Failed to set primary reference" }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("[references PATCH]", error);
      return NextResponse.json({ error: "Failed to update reference" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
