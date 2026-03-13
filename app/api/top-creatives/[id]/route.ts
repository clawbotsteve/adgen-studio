import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { deleteTopCreative } from "@/lib/data/top-creatives";

/**
 * DELETE /api/top-creatives/:id
 * Remove a top-creative reference image.
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireUserTenantApi();
  if ("error" in auth)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed)
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const creativeId = params.id;

  try {
    const success = await deleteTopCreative(auth.tenant.id, creativeId);
    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete creative" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[top-creatives DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete creative" },
      { status: 500 }
    );
  }
}
