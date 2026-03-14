import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { getClient, updateClient } from "@/lib/data/clients";
import { buildMasterContextString } from "@/lib/data/brand-context";

interface GeneratedPrompt {
  angle: string;
  concept: string;
  prompt_text: string;
  tags: string[];
}

const ANGLES = [
  { key: "product_hero", label: "Product Hero", count: 4 },
  { key: "ugc_testimonial", label: "UGC / Testimonial", count: 4 },
  { key: "problem_solution", label: "Problem / Solution", count: 4 },
  { key: "lifestyle_benefit", label: "Lifestyle / Benefit", count: 4 },
  { key: "offer_urgency", label: "Offer / Urgency", count: 4 },
];

/**
 * POST /api/client-generator/generate-prompts
 * Generate 20 ad prompts (4 per angle) using Grok AI.
 * Prompts are reference-preserving: they instruct the image model
 * to keep the exact product from the reference image and only
 * change the environment, background, lighting, and mood.
 */
export async function POST(request: Request) {
  const auth = await requireUserTenantApi();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = (await request.json()) as { clientId?: string };
  if (!body.clientId) {
    return NextResponse.json({ error: "Missing clientId" }, { status: 400 });
  }

  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GROK_API_KEY not configured" }, { status: 500 });
  }

  try {
    const client = await getClient(auth.tenant.id, body.clientId);
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const fd = (client.defaults as Record<string, unknown>)?.formData as Record<string, string> | undefined;

    const brandInfo = [
      fd?.productName ? "Product: " + fd.productName : "",
      fd?.productDescription ? "Description: " + fd.productDescription : "",
      fd?.usp ? "USP: " + fd.usp : "",
      fd?.brandColors ? "Brand colors: " + fd.brandColors : "",
      fd?.visualStyle ? "Visual style: " + fd.visualStyle : "",
      fd?.moodTone ? "Brand tone/mood: " + fd.moodTone : "",
      fd?.targetAudience ? "Target audience: " + fd.targetAudience : "",
      fd?.moreOfThis ? "Creative direction (do more): " + fd.moreOfThis : "",
      fd?.lessOfThat ? "Creative direction (avoid): " + fd.lessOfThat : "",
    ].filter(Boolean).join("\n");

    let masterContext = "";
    try {
      masterContext = await buildMasterContextString(auth.tenant.id, body.clientId) || "";
    } catch { /* ignore */ }

    const fullContext = [brandInfo, masterContext].filter(Boolean).join("\n\n");

    if (!fullContext.trim()) {
      return NextResponse.json(
        { error: "No brand data found. Please fill in at least Product Info before generating." },
        { status: 400 }
      );
    }

    const angleDescriptions = ANGLES.map(a => a.key + " (" + a.label + "): " + a.count + " prompts").join("\n");

    const systemPrompt = `You are an expert AI ad creative director specializing in IMAGE EDITING prompts.

CRITICAL RULE: Every prompt you write is for an IMAGE EDITING model, NOT an image generation model.
The model receives a REFERENCE IMAGE of the actual product. Your prompts must:
1. NEVER describe the product itself — the model already has the real product photo
2. ONLY describe changes to the ENVIRONMENT, BACKGROUND, LIGHTING, and MOOD
3. Always start with "Edit this image to..." or "Change the background to..."
4. Explicitly state "Keep the exact product unchanged" in every prompt

Think of it like Photoshop — you are changing everything AROUND the product, not the product itself.

Each prompt should specify:
- New background/setting
- Lighting direction and mood
- Color grading or tonal shift
- Camera framing adjustments (if any)

Make prompts 2-3 sentences. Be specific about the environment change.`;

    const userPrompt = `Generate exactly 20 image EDITING prompts for this brand's product, distributed across 5 ad angles (4 prompts each):

${angleDescriptions}

Brand data:
${fullContext}

REMEMBER: These prompts edit an existing product photo. The product is already in the image.
Only describe the NEW environment, background, lighting, and mood.
Never describe what the product looks like — the model sees the actual product.

Return ONLY a JSON array of 20 objects:
- "angle": one of "product_hero", "ugc_testimonial", "problem_solution", "lifestyle_benefit", "offer_urgency"
- "concept": short 2-5 word name for the vibe/setting
- "prompt_text": the editing prompt (2-3 sentences, starts with "Edit this image to...")
- "tags": array of 2-4 relevant tags

Return ONLY the JSON array. No markdown, no explanation.`;

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
      console.error("[generate-prompts] Grok error:", grokResponse.status, errText);
      return NextResponse.json(
        { error: "AI prompt generation failed (" + grokResponse.status + ")" },
        { status: 502 }
      );
    }

    const grokData = await grokResponse.json();
    let rawContent = grokData.choices?.[0]?.message?.content?.trim() ?? "";

    if (rawContent.startsWith("\`\`\`")) {
      rawContent = rawContent.replace(/^\`\`\`(?:json)?\n?/, "").replace(/\n?\`\`\`$/, "");
    }

    const parsed: GeneratedPrompt[] = JSON.parse(rawContent);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return NextResponse.json({ error: "AI returned empty results" }, { status: 502 });
    }

    const validAngles = new Set(ANGLES.map(a => a.key));
    const prompts: GeneratedPrompt[] = parsed
      .filter(p => p.angle && p.concept && p.prompt_text && validAngles.has(p.angle))
      .map(p => ({
        angle: p.angle,
        concept: String(p.concept).slice(0, 200),
        prompt_text: String(p.prompt_text).slice(0, 2000),
        tags: Array.isArray(p.tags) ? p.tags.map((t: unknown) => String(t)).slice(0, 10) : [],
      }));

    // Save to client defaults
    const currentDefaults = (client.defaults as Record<string, unknown>) || {};
    await updateClient(auth.tenant.id, body.clientId, {
      defaults: {
        ...currentDefaults,
        generatedPrompts: prompts,
        promptsGeneratedAt: new Date().toISOString(),
      } as Record<string, unknown>,
    });

    return NextResponse.json({ prompts, count: prompts.length });
  } catch (error) {
    console.error("[generate-prompts] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate prompts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}