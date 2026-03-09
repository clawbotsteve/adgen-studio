import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { createPromptPack, bulkCreatePromptItems } from "@/lib/data/prompts";
import { PROMPT_TEMPLATES } from "@/lib/constants/promptTemplates";

export async function POST(request: Request) {
  const auth = await requireUserTenantApi();
  if ("error" in auth)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed)
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = (await request.json()) as {
    templateId?: string;
    customName?: string;
  };

  if (!body.templateId) {
    return NextResponse.json(
      { error: "Template ID is required" },
      { status: 400 }
    );
  }

  const template = PROMPT_TEMPLATES.find((t) => t.id === body.templateId);
  if (!template) {
    return NextResponse.json(
      { error: "Template not found" },
      { status: 404 }
    );
  }

  try {
    const packName = body.customName?.trim() || template.name;

    // Create the prompt pack
    const pack = await createPromptPack(auth.tenant.id, {
      name: packName,
      description: template.description,
      tags: [template.id, "template"],
    });

    // Bulk create all template items
    await bulkCreatePromptItems(
      pack.id,
      template.items.map((item) => ({
        concept: item.concept,
        prompt_text: item.prompt_text,
        tags: item.tags,
      }))
    );

    return NextResponse.json({ pack }, { status: 201 });
  } catch (error) {
    console.error("[use-template POST]", error);
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create pack from template", detail: message },
      { status: 500 }
    );
  }
}
