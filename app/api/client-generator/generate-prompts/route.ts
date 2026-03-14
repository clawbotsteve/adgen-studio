import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { getClient, updateClient } from "@/lib/data/clients";
import { listTopCreatives } from "@/lib/data/top-creatives";

/* ── Types ─────────────────────────────────────────────── */

type AngleKey =
  | "us_vs_them"
  | "key_feature"
  | "testimonial_review"
  | "bundle_offer";

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
      text: `You are an expert DTC brand analyst. Deeply analyze each uploaded reference image in extreme detail. For each image describe:

1. PRODUCT: Exact product type (snapback/baseball/trucker cap, polo, tee, etc.), exact colours, materials, textures. Describe any logo/embroidery in detail (e.g. "gold embroidered crest on black structured snapback" not "hat with logo").
2. MODEL: Age range, gender, build (athletic/slim/etc), pose, expression (confident/relaxed/cool), exact outfit details including layering (open shirt over tee? chain? cardigan draped?), accessories, hair style.
3. BACKGROUND & SETTING: Exact environment — clean studio, urban street, outdoor, etc. Describe specific elements, colours, surfaces, props visible.
4. LIGHTING: Direction, quality, mood — soft natural, golden hour, studio flash, dramatic shadows, etc.
5. BRAND AESTHETIC: Infer the overall brand vibe from what you see — is it clean & minimal? Bold & vibrant? Luxury streetwear? Quiet premium? Athletic? Describe the energy.
6. COLOUR PALETTE: List the dominant colours in order of prominence and describe how they interact (e.g. "primary black and white with subtle gold accents — restrained, high-end feel").

Be extremely specific with every detail. This analysis will directly inform the style, mood, and tone of 20 ad prompts, so accuracy matters enormously.`,
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

    const systemPrompt = `You are an expert prompt engineer for ready-to-post Instagram ad creatives for DTC brands. You have been given a detailed image analysis and brand info. Your job is to generate 20 image-editing prompts that an AI photo editor will use to transform reference photos into scroll-stopping ads.

HOW THE AI PHOTO EDITOR WORKS:
- It takes the original reference photo and edits ONLY the background, lighting, mood, and environment
- The product, person, clothing, pose, and logos stay EXACTLY the same — never describe or change these
- Your prompts describe the SCENE, SETTING, LIGHTING, and MOOD for the final ad image

STEP 1 — UNDERSTAND THE BRAND:
Read the image analysis and brand info carefully. Identify:
- The brand's visual style (clean & minimal? bold & vibrant? luxury streetwear? quiet premium?)
- The colour palette (what are the primary/accent colours? keep prompts within this palette)
- The mood/tone (confident & cool? energetic? aspirational? understated swagger?)
- The target audience (age, gender, lifestyle — what environments resonate with them?)
- Key product features mentioned (perfect fit? limited drops? durability? premium materials?)

STEP 2 — MATCH EVERY PROMPT TO THE BRAND:
This is critical. Every prompt must feel on-brand:
- If the brand is CLEAN & MINIMAL: use soft natural lighting, simple clean backgrounds, subtle accents. NO heavy grit, neon overload, dramatic vaults, thrones, or pulsing clubs.
- If the brand is BOLD & VIBRANT: use energetic colours, dynamic environments, striking contrasts.
- If the brand is LUXURY / QUIET PREMIUM: use restrained elegance, muted tones with subtle premium accents (gold, marble, leather), understated confidence.
- If the brand is URBAN / STREET: use authentic urban environments, street culture references, real-world settings.
- ALWAYS stay within the brand's colour palette. If the brand colours are black, white, and gold — the environments should echo those tones, not introduce random neon pinks or electric blues.

MANDATORY RULES — NEVER BREAK THESE:
1. Start every prompt with "Keep the exact same product and outfit unchanged."
2. NEVER describe the product, clothing, logos, or the person — the AI already sees them.
3. NEVER include Midjourney flags (--ar, --v, --q, --stylize) — this is not Midjourney.
4. NEVER ask for text overlays, price tags, captions, badges, or any graphic design elements — this is a photo editor, not a design tool.
5. NEVER ask for split-screens, side-by-side comparisons, before/after composites, collages, or multiple panels — the editor works on a single image.
6. NEVER use technical jargon like colour temperatures (4000K), f-stops, or softbox specs.
7. Each prompt should be 2-4 sentences. Vivid, specific, concise.
8. The lighting style in your prompts should match the brand aesthetic — soft natural for clean brands, dramatic for bold brands, warm subtle for premium brands.

AD CATEGORIES — generate exactly 5 prompts for each:

1. US VS THEM — Subtle visual superiority. The scene should make the person look elevated, composed, and premium — like they chose the best and they know it. Use environments that communicate quality and confidence: clean bright studios, premium minimalist spaces, elevated urban settings. The visual says "this is the real deal" through quiet confidence, NOT aggressive dominance. Think: the person looks so good in their environment that cheap alternatives become unthinkable.

2. KEY FEATURE CALLOUTS — The environment visually reinforces the product's key selling points. If the product is about perfect fit/comfort, show relaxed comfortable settings (urban loft, morning coffee, easy living). If it's about durability, show settings that imply toughness without being gritty. If it's about style/limited editions, show fashion-forward or culturally relevant environments. The background and mood should make viewers FEEL the feature without any text needed.

3. TESTIMONIAL / REVIEW STYLE — Authentic real-customer energy. Natural, relatable settings where someone would genuinely show off a purchase they love: sidewalk cafe, gym mirror, travel snapshot, bedroom mirror selfie vibe, creator workspace, hanging with friends. Soft natural lighting, candid energy, real-life warmth. Should feel like an organic Instagram post from a happy customer, not a studio shoot. Trustworthy and relatable.

4. BUNDLE / OFFER BASED — Premium visual impact that stops the scroll. Clean but striking: think spotlight-on-dark, rich moody backgrounds with the brand's accent colours glowing, dramatic but tasteful lighting, exclusive atmosphere. Should evoke "limited drop" and "premium collection" energy. The scene should make viewers feel desire and urgency — like this is something special they need to grab before it's gone. Keep it on-brand (if the brand is minimal, the drama should be restrained and elegant, not over-the-top).

Return a JSON array of exactly 20 objects:
- "angle": one of "us_vs_them", "key_feature", "testimonial_review", "bundle_offer"
- "label": a short 2-5 word descriptive title for the ad concept
- "prompt_text": the 2-4 sentence prompt

Generate exactly 5 prompts per category (5 x 4 = 20 total).`;

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
      "Generate 20 high-conversion ad image prompts (5 per category: US VS THEM, KEY FEATURE CALLOUTS, TESTIMONIAL/REVIEW STYLE, BUNDLE/OFFER BASED). CRITICAL: Match every prompt to the brand's visual style, colour palette, and mood from the brand info and image analysis. If the brand is clean & minimal, keep scenes clean and minimal. If the brand uses black/white/gold, keep environments in those tones. Each prompt: 2-4 sentences, describe only the scene/background/lighting/mood — never the product or person. Return ONLY the JSON array, no markdown."
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
