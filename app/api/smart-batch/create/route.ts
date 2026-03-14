import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { createBatchRun, createBatchItems } from "@/lib/data/batches";
import { getProfile } from "@/lib/data/profiles";
import { getClient } from "@/lib/data/clients";
import { buildMasterContextString } from "@/lib/data/brand-context";

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object") {
    const obj = e as Record<string, unknown>;
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.details === "string")
      return `${obj.message ?? "error"}: ${obj.details}`;
    try {
      return JSON.stringify(e);
    } catch {
      /* fallback */
    }
  }
  return String(e);
}

interface SavedPrompt {
  angle: string;
  label: string;
  prompt_text: string;
}

interface GeneratedPrompt {
  concept: string;
  prompt_text: string;
  tags: string[];
}

/**
 * Generate prompts from client brand context using Grok AI.
 * This is the FALLBACK path when no saved prompts exist.
 */
async function generatePromptsFromClient(
  brandContext: string,
  clientName: string,
  count: number
): Promise<GeneratedPrompt[]> {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) {
    throw new Error("GROK_API_KEY not configured");
  }

  const systemPrompt = `You are an expert AI image prompt engineer for advertising and e-commerce creative production.
You generate detailed, production-ready image generation prompts based on brand context data.

Each prompt should include:
- A short "concept" name (2-5 words)
- A detailed "prompt_text" for AI image generation (2-4 sentences)
- Relevant "tags" for categorization

Make each prompt unique and varied.`;

  const userPrompt = `Generate exactly ${count} image generation prompts for the brand "${clientName}" based on this brand context:

${brandContext}

Respond with ONLY a JSON array of objects, each with "concept" (string), "prompt_text" (string), and "tags" (string array). No markdown, no explanation, just the JSON array.`;

  const grokResponse = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4-latest",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
    }),
  });

  if (!grokResponse.ok) {
    const errText = await grokResponse.text();
    console.error(
      "[smart-batch] Grok API error:",
      grokResponse.status,
      errText
    );
    throw new Error(`Grok API returned ${grokResponse.status}`);
  }

  const grokData = await grokResponse.json();
  let rawContent = grokData.choices?.[0]?.message?.content?.trim() ?? "";

  if (rawContent.startsWith("```")) {
    rawContent = rawContent
      .replace(/^```(?:json)?\n?/, "")
      .replace(/\n?```$/, "");
  }

  const parsed: GeneratedPrompt[] = JSON.parse(rawContent);

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("AI returned empty results");
  }

  return parsed
    .filter((p) => p.concept && p.prompt_text)
    .map((p) => ({
      concept: String(p.concept).slice(0, 200),
      prompt_text: String(p.prompt_text).slice(0, 2000),
      tags: Array.isArray(p.tags)
        ? p.tags.map((t: unknown) => String(t)).slice(0, 10)
        : [],
    }));
}

export async function POST(request: Request) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = (await request.json()) as {
    clientId?: string;
    profileId?: string;
    aspectRatio?: string;
    resolution?: string;
    quantity?: number;
    selectedAngles?: string[];
    lockAngles?: boolean;
  };

  if (!body.clientId || !body.profileId) {
    return NextResponse.json(
      { error: "Missing required fields: clientId, profileId" },
      { status: 400 }
    );
  }

  const selectedAngles: string[] = Array.isArray(body.selectedAngles)
    ? body.selectedAngles
    : [];
  const lockAngles: boolean = body.lockAngles === true;

  try {
    let client, profile;
    try {
      [client, profile] = await Promise.all([
        getClient(auth.tenant.id, body.clientId),
        getProfile(auth.tenant.id, body.profileId),
      ]);
    } catch (lookupErr) {
      console.error("[smart-batch] Resource lookup error:", lookupErr);
      return NextResponse.json(
        { error: `Resource lookup failed: ${errMsg(lookupErr)}` },
        { status: 500 }
      );
    }

    if (!client || !profile) {
      return NextResponse.json(
        {
          error: `Not found: ${!client ? "client" : ""} ${!profile ? "profile" : ""}`.trim(),
        },
        { status: 404 }
      );
    }

    const quantity = Math.min(Math.max(body.quantity || 5, 1), 20);

    // ── Try to use saved prompts from Client Generator ──
    const savedPrompts: SavedPrompt[] =
      ((client.defaults as Record<string, unknown>)
        ?.generatedPrompts as SavedPrompt[]) || [];

    let prompts: { concept: string; prompt: string }[] = [];
    let usingSavedPrompts = false;

    if (savedPrompts.length > 0) {
      usingSavedPrompts = true;

      // Use saved prompts, filtered by selected angles if any
      let filtered = savedPrompts;
      if (selectedAngles.length > 0) {
        if (lockAngles) {
          filtered = savedPrompts.filter((p) =>
            selectedAngles.includes(p.angle)
          );
        } else {
          const selected = savedPrompts.filter((p) =>
            selectedAngles.includes(p.angle)
          );
          const others = savedPrompts.filter(
            (p) => !selectedAngles.includes(p.angle)
          );
          filtered = [...selected, ...others];
        }
      }

      if (filtered.length === 0) filtered = savedPrompts;

      // Pick prompts up to quantity, cycling if needed
      for (let i = 0; i < quantity; i++) {
        const p = filtered[i % filtered.length];
        prompts.push({
          concept: p.label || p.angle || "creative",
          prompt: p.prompt_text,
        });
      }

      console.log(
        "[smart-batch] Using " +
          prompts.length +
          " saved prompts from Client Generator"
      );
    } else {
      // ── Fallback: generate prompts on the fly with Grok ──
      console.log(
        "[smart-batch] No saved prompts found, falling back to Grok generation"
      );

      let masterContext = "";
      try {
        masterContext =
          (await buildMasterContextString(auth.tenant.id, body.clientId)) || "";
      } catch (ctxErr) {
        console.error("[smart-batch] Brand context error:", ctxErr);
      }

      if (!masterContext) {
        return NextResponse.json(
          {
            error:
              "No brand context or saved prompts found. Please complete the Client Generator first.",
          },
          { status: 400 }
        );
      }

      let generatedPrompts: GeneratedPrompt[];
      try {
        generatedPrompts = await generatePromptsFromClient(
          masterContext,
          client.name,
          quantity
        );
      } catch (genErr) {
        console.error("[smart-batch] Prompt generation error:", genErr);
        return NextResponse.json(
          { error: `Failed to generate prompts: ${errMsg(genErr)}` },
          { status: 502 }
        );
      }

      prompts = generatedPrompts.slice(0, quantity).map((item) => ({
        concept: item.concept,
        prompt: `${masterContext}\n\nGenerate creative for:\n${item.prompt_text}`,
      }));
    }

    if (prompts.length === 0) {
      return NextResponse.json(
        {
          error:
            "No prompts available. Generate prompts in the Client Generator first.",
        },
        { status: 400 }
      );
    }

    // Build metadata — include promptSource so the process route
    // knows to skip the prompt engine for saved (simple) prompts
    const metadata: Record<string, unknown> = {};
    if (selectedAngles.length > 0) {
      metadata.selectedAngles = selectedAngles;
      metadata.lockAngles = lockAngles;
    }
    if (usingSavedPrompts) {
      metadata.promptSource = "client_generator";
    }

    // Create batch run
    let batchRun;
    try {
      batchRun = await createBatchRun({
        tenantId: auth.tenant.id,
        clientId: body.clientId,
        profileId: body.profileId,
        totalItems: prompts.length,
        createdBy: auth.user.id,
        ...(Object.keys(metadata).length > 0
          ? { metadata: JSON.stringify(metadata) }
          : {}),
      });
    } catch (runErr) {
      console.error("[smart-batch] createBatchRun error:", runErr);
      return NextResponse.json(
        { error: `Failed to create batch run: ${errMsg(runErr)}` },
        { status: 500 }
      );
    }

    // Create batch items
    const batchItems = prompts.map((item) => ({
      concept: item.concept,
      prompt: item.prompt,
    }));

    try {
      await createBatchItems(batchRun.id, batchItems);
    } catch (itemErr) {
      console.error("[smart-batch] createBatchItems error:", itemErr);
      return NextResponse.json(
        { error: `Failed to create batch items: ${errMsg(itemErr)}` },
        { status: 500 }
      );
    }

    // Trigger batch processing (fire-and-forget)
    const processUrl = new URL("/api/batch/process", request.url);
    fetch(processUrl.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        runId: batchRun.id,
        tenantId: auth.tenant.id,
        profileId: body.profileId,
        clientId: body.clientId,
        aspectRatio: body.aspectRatio,
        resolution: body.resolution,
      }),
    }).catch((err) => {
      console.error(
        "[smart-batch] Failed to trigger batch processing:",
        err
      );
    });

    return NextResponse.json({ run: batchRun }, { status: 201 });
  } catch (error) {
    console.error("[smart-batch create] Unhandled error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create smart batch";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
