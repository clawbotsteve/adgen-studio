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
 * Generate 20 ad prompts (4 per angle) using Grok AI,
 * based on the client's brand data and saved form fields.
 * Saves the prompts to clients.defaults.generatedPrompts.
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
    // Load client and brand context
    const client = await getClient(auth.tenant.id, body.clientId);
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const fd = (client.defaults as Record<string, unknown>)?.formData as Record<string, string> | undefined;

    // Build context from form data
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

    // Also try master context string for richer data
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

    const systemPrompt = `You are an expert AI ad creative director and image prompt engineer.
You generate production-ready image generation prompts for advertising campaigns.
Each prompt should be vivid, specific, and optimized for AI image generation models.

Include details about: camera angle, lighting, composition, setting, mood, color palette, and styling.
Make prompts feel like a cohesive ad campaign — varied shots but unified brand feel.
Each prompt_text should be 2-4 sentences.`;

    const userPrompt = `Generate exactly 20 image generation prompts for this brand, distributed across 5 ad angles (4 prompts each):

${angleDescriptions}

Brand data:
${fullContext}

IMPORTANT: Return ONLY a JSON array of 20 objects. Each object must have:
- "angle": one of "product_hero", "ugc_testimonial", "problem_solution", "lifestyle_benefit", "offer_urgency"
- "concept": short 2-5 word name for the shot
- "prompt_text": detailed 2-4 sentence image generation prompt
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

    // Strip markdown fences if present
    if (rawContent.startsWith("\`\`\`")) {
      rawContent = rawContent.replace(/^\`\`\`(?:json)?\n?/, "").replace(/\n?\`\`\`$/, "");
    }

    const parsed: GeneratedPrompt[] = JSON.parse(rawContent);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return NextResponse.json({ error: "AI returned empty results" }, { status: 502 });
    }

    // Clean and validate
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