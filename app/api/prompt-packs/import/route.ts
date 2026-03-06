import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { bulkCreatePromptItems } from "@/lib/data/prompts";
import { validatePromptItems } from "@/lib/validation/prompt";

export async function POST(request: Request) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = (await request.json()) as {
    packId?: string;
    content?: string;
    format?: "csv" | "json";
  };

  if (!body.packId?.trim()) {
    return NextResponse.json({ error: "Pack ID is required" }, { status: 400 });
  }
  if (!body.content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const format = body.format || "csv";

  let items: Array<{ concept: string; prompt_text: string; tags?: string[] }> = [];

  try {
    if (format === "csv") {
      // Parse CSV: concept,prompt_text,tags (comma-separated)
      const lines = body.content.trim().split("\n");
      items = lines
        .filter((line) => line.trim().length > 0)
        .map((line) => {
          const parts = line.split(",");
          if (parts.length < 2) throw new Error("CSV must have at least 2 columns");
          return {
            concept: parts[0].trim().replace(/^"|"$/g, ""),
            prompt_text: parts[1].trim().replace(/^"|"$/g, ""),
            tags: parts[2]
              ?.split("|")
              .map((t) => t.trim())
              .filter((t) => t.length > 0),
          };
        });
    } else if (format === "json") {
      // Parse JSON array of objects
      const parsed = JSON.parse(body.content);
      if (!Array.isArray(parsed)) {
        throw new Error("JSON must be an array");
      }
      items = parsed;
    }

    // Validate items
    const validation = validatePromptItems(items);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Validation failed",
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    // Bulk create items
    const count = await bulkCreatePromptItems(body.packId.trim(), items);

    return NextResponse.json({ imported: count }, { status: 200 });
  } catch (error) {
    console.error("[prompt-packs import]", error);
    const message =
      error instanceof Error ? error.message : "Failed to import items";
    return NextResponse.json(
      { error: `Import failed: ${message}` },
      { status: 400 }
    );
  }
}
