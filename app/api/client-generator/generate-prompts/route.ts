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

    /* ── Generate 20 rich, descriptive prompts via Grok ── */

    const systemPrompt = `You write image-editing prompts for an AI tool that takes a reference photo and transforms it into a scroll-stopping ad creative. You are a world-class creative director writing briefs for high-end fashion and product campaigns.

CRITICAL RULES:
- The reference photo already contains the product/model — NEVER describe the product, clothing, logos, or the person. The AI already sees them.
- ONLY describe what to CHANGE or ADD: the background/setting, lighting mood, composition style, overall atmosphere, and the emotional energy of the final image.
- Always start with "keep the exact same product and outfit unchanged" then describe the new scene.
- Write rich, descriptive prompts (2-4 sentences). Paint the full picture of what the final image should FEEL like.
- Describe the vibe, lighting quality, depth of field, composition style, and editorial feel.
- Think high-end fashion campaign, Instagram ad-ready, scroll-stopping.
- Use descriptive modifiers: cinematic, editorial, aspirational, premium, heroic, warm, moody, golden hour, shallow depth of field, rim lighting, etc.
- NEVER include Midjourney flags (--ar, --v, --q, --stylize). These are not used.
- NEVER ask for text overlays, split-screens, countdown timers, price tags, or any graphic design elements. The AI generates photos, not graphics.
- NEVER ask for before/after splits or composite images.
- NEVER use technical jargon like color temperatures (4000K, 5500K), f-stops, or softbox angles.

GOOD prompt examples:
- "Keep the exact same product and outfit unchanged. Premium fashion campaign photo, dramatic American flag backdrop filling the frame, golden hour sunlight with warm cinematic rim lighting, shallow depth of field, patriotic luxury streetwear vibe, heroic composition, high-end editorial style, aspirational energy, vertical Instagram ad format"
- "Keep the exact same product and outfit unchanged. Cinematic outdoor portrait setting on a city rooftop at sunset, skyline glowing in the background, warm golden light wrapping around the subject, confident powerful pose energy, high-end streetwear campaign feel, moody yet empowering atmosphere, professional product photography"
- "Keep the exact same product and outfit unchanged. Lifestyle scene in a premium gym environment, clean modern equipment softly blurred in background, dramatic overhead lighting casting bold shadows, athletic confident energy, fitness meets fashion editorial, detailed texture on all fabrics, aspirational masculine vibe"
- "Keep the exact same product and outfit unchanged. Casual street-style scene on a busy downtown sidewalk, natural afternoon light, slight motion blur on passing pedestrians, subject sharp and in focus, urban luxury feel, candid yet polished composition, social media ready lifestyle shot"
- "Keep the exact same product and outfit unchanged. Studio shot with rich solid deep-navy background, single dramatic key light from the side creating depth and shadow, clean minimal composition, the product is the star, premium e-commerce campaign feel, high detail on fabric textures"`;

    // Add BAD examples and angle guidelines to system prompt
    const systemPromptFull = systemPrompt + `

BAD prompt examples (NEVER write prompts like these):
- "Add bold red urgency overlays with LIMITED DROP text" (no text/graphics)
- "Split the scene with before on left and after on right" (no split-screens)
- "Set lighting to dual softboxes at 45deg, neutral 5500K" (no technical jargon)
- "Handsome young man wearing black cap with gold logo" (never describe the product/person)
- "Change background to gym --ar 2:3 --v 6" (no Midjourney flags)

You must return a JSON array of exactly 20 objects. Each object has:
- "angle": one of "product_hero", "ugc", "problem_solution", "lifestyle", "offer_urgency"
- "label": a short 2-4 word name for the prompt
- "prompt_text": the rich descriptive editing prompt (2-4 sentences)

Generate exactly 4 prompts per angle (4 x 5 = 20 total).

Angle guidelines:
- product_hero: Premium studio or high-end editorial settings. Think fashion campaign hero shots — dramatic lighting, clean compositions, the product is the star. Cinematic, aspirational, magazine-cover energy.
- ugc: Casual real-life settings that feel authentic and relatable. Someone using the product in everyday life — street corners, coffee shops, gym mirrors, park benches. Candid feel but still polished enough for Instagram.
- problem_solution: Scenes that visually communicate the product making life better. Show environments that contrast comfort vs discomfort, confidence vs doubt, standing out vs blending in — through MOOD and SETTING only, not through split-screens or text.
- lifestyle: Aspirational lifestyle scenes that match the target audience's dreams. Rooftop sunsets, travel destinations, fitness environments, urban exploration. The product fits naturally into an elevated life.
- offer_urgency: High-energy, attention-grabbing scenes with bold visual impact. Think dramatic lighting, striking colour contrasts, powerful compositions that make you stop scrolling. Premium drop energy — exclusive, limited, desirable. No text or price graphics.`;

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
      "Generate 20 rich, descriptive editing prompts (4 per angle). Each prompt should be 2-4 sentences painting the full picture of the final image's mood, lighting, composition, and energy. Remember: never describe the product or person, only the scene and vibe. Return ONLY the JSON array, no markdown."
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
          { role: "system", content: systemPromptFull },
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
        prompt_text: String(p.prompt_text).slice(0, 1000),
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
