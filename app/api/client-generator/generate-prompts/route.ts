import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { getClient, updateClient } from "@/lib/data/clients";
import { listTopCreatives } from "@/lib/data/top-creatives";

/* ── Types ─────────────────────────────────────────────── */

type AngleKey =
  | "product_hero"
  | "ugc"
  | "problem_solution"
  | "lifestyle"
  | "offer_urgency";

interface GeneratedPrompt {
  angle: AngleKey;
  label: string;
  prompt_text: string;
}

/* ── Helpers ───────────────────────────────────────────── */

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

/**
 * Step 1 — Ask Grok Vision to describe each top-creative image
 * in plain language: what product is shown, background, vibe, colours.
 */
async function analyzeImages(
  imageUrls: string[],
  apiKey: string
): Promise<string> {
  if (imageUrls.length === 0) return "";

  const content: { type: string; text?: string; image_url?: { url: string } }[] = [
    {
      type: "text",
      text: "Describe each image in 2-3 short sentences. Focus on: what the product is, what setting/background is used, the overall colour palette, and the vibe or mood. Be specific and concise — no poetic language, just describe what you see.",
    },
    ...imageUrls.slice(0, 5).map((url) => ({
      type: "image_url" as const,
      image_url: { url },
    })),
  ];

  const resp = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4-latest",
      messages: [{ role: "user", content }],
      temperature: 0.3,
    }),
  });

  if (!resp.ok) {
    console.error("[generate-prompts] Vision API error:", resp.status);
    return "";
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

/* ── POST handler ──────────────────────────────────────── */

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
    return NextResponse.json(
      { error: "Missing clientId" },
      { status: 400 }
    );
  }

  try {
    const client = await getClient(auth.tenant.id, body.clientId);
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const defaults = (client.defaults ?? {}) as Record<string, unknown>;
    const formData = (defaults.formData ?? {}) as Record<string, unknown>;

    /* ── Gather brand context from form data ─────────── */

    const brandParts: string[] = [];
    if (formData.productName) brandParts.push(`Product: ${formData.productName}`);
    if (formData.productDescription) brandParts.push(`Description: ${formData.productDescription}`);
    if (formData.visualStyle) brandParts.push(`Visual style: ${formData.visualStyle}`);
    if (formData.colorPalette) brandParts.push(`Colour palette: ${formData.colorPalette}`);
    if (formData.targetAge) brandParts.push(`Target audience age: ${formData.targetAge}`);
    if (formData.targetGender) brandParts.push(`Target gender: ${formData.targetGender}`);
    if (formData.targetInterests) brandParts.push(`Interests: ${formData.targetInterests}`);
    if (formData.moreOfThis) brandParts.push(`More of: ${formData.moreOfThis}`);
    if (formData.lessOfThis) brandParts.push(`Less of: ${formData.lessOfThis}`);

    const brandContext = brandParts.join("\n");

    /* ── Fetch + analyse top creatives ───────────────── */

    const creatives = await listTopCreatives(auth.tenant.id, body.clientId);
    const imageUrls = creatives.map((c) => c.url).filter(Boolean);

    const apiKey = process.env.GROK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GROK_API_KEY not configured" }, { status: 500 });
    }

    let imageAnalysis = "";
    if (imageUrls.length > 0) {
      imageAnalysis = await analyzeImages(imageUrls, apiKey);
    }

    /* ── Generate 20 simple, natural prompts via Grok ── */

    const systemPrompt = `You write short image-editing prompts for an AI tool that takes a reference photo and edits it.

CRITICAL RULES:
- Every prompt must be 1-2 sentences MAX. Short and simple.
- The reference photo already contains the product — never describe the product itself.
- Only describe what to CHANGE: the background, setting, vibe, or mood.
- Use natural, conversational language like you're telling a photo editor what to do.
- Always include "realistic image" and "keep the same product" or similar.
- Think "ready to post on Instagram" — clean, commercial, scroll-stopping.
- NO technical jargon (no color temperatures, no lighting angles, no f-stops).
- NO poetic or artsy language. Be direct and specific.

GOOD prompt examples:
- "realistic image, place the product on a clean white marble countertop, soft natural window light, ready for instagram"
- "realistic image, change the background to a gym locker room setting, keep the exact same product, moody warm tones"
- "realistic image, put the product in someone's hand walking down a busy city street, golden hour lighting, lifestyle feel"
- "realistic image, studio shot with a bold solid-colour background, keep the same product, clean and minimal"
- "realistic image, outdoor setting on a wooden picnic table in a park, natural daylight, fresh and vibrant feel"

BAD prompt examples (do NOT write prompts like these):
- "Replace background with weathered red brick wall in dimly lit alley. Set lighting to single overhead streetlamp from above at 45deg, cool 4000K with hard shadows."
- "Edit this image to feature a background of abstract cultural motifs in navy and moss green tones"
- "Change background to plain white seamless cyclorama. Use lighting from dual softboxes at 45deg left and right, neutral 5500K"

You must return a JSON array of exactly 20 objects. Each object has:
- "angle": one of "product_hero", "ugc", "problem_solution", "lifestyle", "offer_urgency"
- "label": a short 2-4 word name for the prompt
- "prompt_text": the actual short editing prompt (1-2 sentences)

Generate exactly 4 prompts per angle (4 x 5 = 20 total).

Angle guidelines (keep prompts simple, these are just themes):
- product_hero: clean studio or premium settings that make the product look high-end
- ugc: casual real-life settings like someone holding/wearing/using the product
- problem_solution: settings that show before/after vibes or the product solving a problem
- lifestyle: aspirational lifestyle settings that match the brand's target audience
- offer_urgency: bold, attention-grabbing settings with energy (sales, limited drops, urgency feel)`;

    const userParts: string[] = [];
    if (brandContext) {
      userParts.push("Here is the brand info:\n" + brandContext);
    }
    if (imageAnalysis) {
      userParts.push(
        "Here is what the reference photos look like:\n" + imageAnalysis
      );
    }
    userParts.push(
      "Generate 20 short, natural editing prompts (4 per angle). Keep every prompt to 1-2 simple sentences. Return ONLY the JSON array, no markdown."
    );

    const grokResp = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4-latest",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userParts.join("\n\n") },
        ],
        temperature: 0.7,
      }),
    });

    if (!grokResp.ok) {
      const errText = await grokResp.text();
      console.error("[generate-prompts] Grok error:", grokResp.status, errText);
      return NextResponse.json(
        { error: `Grok API returned ${grokResp.status}` },
        { status: 502 }
      );
    }

    const grokData = await grokResp.json();
    let raw = grokData.choices?.[0]?.message?.content?.trim() ?? "";

    // Strip markdown fences if present
    if (raw.startsWith("```")) {
      raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let prompts: GeneratedPrompt[];
    try {
      prompts = JSON.parse(raw);
    } catch {
      console.error("[generate-prompts] JSON parse failed. Raw:", raw.slice(0, 500));
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 502 }
      );
    }

    if (!Array.isArray(prompts) || prompts.length === 0) {
      return NextResponse.json(
        { error: "AI returned empty results" },
        { status: 502 }
      );
    }

    // Sanitise
    prompts = prompts
      .filter((p) => p.angle && p.prompt_text)
      .map((p) => ({
        angle: p.angle,
        label: String(p.label || "Untitled").slice(0, 100),
        prompt_text: String(p.prompt_text).slice(0, 500),
      }));

    /* ── Save to client defaults ─────────────────────── */

    const updatedDefaults = {
      ...defaults,
      generatedPrompts: prompts,
      imageAnalysis,
      promptsGeneratedAt: new Date().toISOString(),
    };

    await updateClient(auth.tenant.id, body.clientId, {
      defaults: updatedDefaults,
    });

    return NextResponse.json({
      prompts,
      count: prompts.length,
      imagesAnalyzed: imageUrls.length,
    });
  } catch (error) {
    console.error("[generate-prompts] Unhandled error:", error);
    return NextResponse.json(
      { error: errMsg(error) },
      { status: 500 }
    );
  }
}
