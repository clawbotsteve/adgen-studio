import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { listPromptPacks, createPromptPack } from "@/lib/data/prompts";

export async function GET() {
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const packs = await listPromptPacks(auth.tenant.id);
    return NextResponse.json({ packs });
  } catch (error) {
    console.error("[prompt-packs GET]", error);
    return NextResponse.json({ error: "Failed to fetch prompt packs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = (await request.json()) as {
    name?: string;
    description?: string;
    tags?: string[];
  };

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Pack name is required" }, { status: 400 });
  }

  try {
    const pack = await createPromptPack(auth.tenant.id, {
      name: body.name.trim(),
      description: body.description?.trim() || undefined,
      tags: body.tags || [],
    });
    return NextResponse.json({ pack }, { status: 201 });
  } catch (error) {
    console.error("[prompt-packs POST]", error);
    return NextResponse.json({ error: "Failed to create prompt pack" }, { status: 500 });
  }
}
