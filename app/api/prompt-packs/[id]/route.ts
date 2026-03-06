import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import {
  getPromptPack,
  deletePromptPack,
  listPromptItems,
} from "@/lib/data/prompts";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const pack = await getPromptPack(auth.tenant.id, id);
    if (!pack) {
      return NextResponse.json({ error: "Pack not found" }, { status: 404 });
    }

    const items = await listPromptItems(id);

    return NextResponse.json({ pack, items });
  } catch (error) {
    console.error("[prompt-packs GET detail]", error);
    return NextResponse.json(
      { error: "Failed to fetch prompt pack" },
      { status: 500 }
    );
  }
}

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
    const pack = await getPromptPack(auth.tenant.id, id);
    if (!pack) {
      return NextResponse.json({ error: "Pack not found" }, { status: 404 });
    }

    const success = await deletePromptPack(auth.tenant.id, id);
    if (!success) {
      return NextResponse.json({ error: "Failed to delete pack" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[prompt-packs DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete prompt pack" },
      { status: 500 }
    );
  }
}
