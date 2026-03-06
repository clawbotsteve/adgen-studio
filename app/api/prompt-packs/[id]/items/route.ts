import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { listPromptItems, createPromptItem } from "@/lib/data/prompts";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const items = await listPromptItems(params.id);
    return NextResponse.json({ items });
  } catch (error) {
    console.error("[prompt-packs items GET]", error);
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = (await request.json()) as {
    concept?: string;
    prompt_text?: string;
    tags?: string[];
  };

  if (!body.concept?.trim()) {
    return NextResponse.json({ error: "Concept is required" }, { status: 400 });
  }
  if (!body.prompt_text?.trim()) {
    return NextResponse.json({ error: "Prompt text is required" }, { status: 400 });
  }

  try {
    const item = await createPromptItem(params.id, {
      concept: body.concept.trim(),
      prompt_text: body.prompt_text.trim(),
      tags: body.tags || [],
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("[prompt-packs items POST]", error);
    return NextResponse.json(
      { error: "Failed to create prompt item" },
      { status: 500 }
    );
  }
}
