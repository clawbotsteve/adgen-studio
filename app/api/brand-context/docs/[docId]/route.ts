import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { deleteBrandContextDoc } from "@/lib/data/brand-context";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ docId: string }> }
) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { docId } = await params;

  if (!docId) {
    return NextResponse.json(
      { error: "Missing docId" },
      { status: 400 }
    );
  }

  try {
    const success = await deleteBrandContextDoc(auth.tenant.id, docId);
    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete document" },
        { status: 500 }
      );
    }
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("[brand-context-docs DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
