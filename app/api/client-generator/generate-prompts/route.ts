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

    const systemPrompt = `You are an expert ad creative prompt engineer for photorealistic DTC product ads. You write prompts for an AI photo editor that transforms reference photos into high-converting social ad creatives.

HOW THE AI PHOTO EDITOR WORKS:
- It takes the original reference photo and edits ONLY the background, lighting, environment, and overall aesthetic treatment
- The product, person, clothing, pose, and logos stay EXACTLY the same — never describe these
- Think of it as a photorealistic scene/backdrop replacement with lighting control

PROMPT FORMULA — use this structure for EVERY prompt:
"Keep the exact same product and outfit unchanged. [Background treatment + colour palette], [lighting style], [composition feel + negative space], [realism/texture keywords], [ad aesthetic]. No text overlay."

VARIATION AXES — you MUST vary at least 3 of these between every prompt:
1. BACKGROUND TYPE: solid seamless sweep, gradient studio, concrete/textured wall, environmental location, moody dark void, outdoor natural, architectural element
2. COLOUR PALETTE: warm mustard/ochre, cool charcoal/slate, cream/off-white, deep navy, forest green, terracotta, brand-specific accent colours from the analysis
3. LIGHTING STYLE: soft commercial studio, directional dramatic with hard shadows, golden hour rim light, overhead flat beauty light, low-key moody spotlight, backlit silhouette edge, diffused overcast natural
4. COMPOSITION FEEL: clean negative space left for CTA, tight crop energy, centered symmetrical hero, rule-of-thirds offset, low angle power shot feel, environmental depth with bokeh
5. AD ENERGY: premium ecommerce hero, streetwear editorial, candid social proof, exclusive drop announcement, lifestyle aspiration, conversion-focused DTC

REALISM KEYWORDS — weave these naturally into prompts:
photorealistic, crisp product texture, realistic material detail, premium commercial quality, high-end DTC brand aesthetic, social-ad-ready composition

THINGS TO NEVER DO:
- Describe the product, clothing, logos, or the person (the AI already sees them)
- Include Midjourney flags (--ar, --v, --q, --stylize)
- Ask for text overlays, price tags, captions, badges, or graphic design elements
- Ask for split-screens, side-by-side, before/after, collages, or multiple panels
- Use technical jargon like colour temperatures (4000K), f-stops, or softbox model names
- Use cartoon, CGI, anime, or surreal effects
- Create cluttered busy backgrounds
- Repeat the same background + lighting combo across prompts

BRAND MATCHING:
Read the image analysis and brand info carefully. Pull the brand's actual colour palette, vibe, and energy into your prompts. If the brand is clean & minimal, keep backgrounds clean. If the brand uses black/white/gold, echo those tones. Stay on-brand but VARY the execution creatively.

AD CATEGORIES — 5 prompts each, but make every single prompt visually distinct:

1. US VS THEM — Premium visual superiority. The scene makes the product look elevated and worth every penny. Think: clean studio hero shots, premium minimalist environments, gallery-white spaces, architectural concrete. The vibe says "this is the real deal" without trying too hard.

2. KEY FEATURE CALLOUTS — The backdrop and mood visually sell the product's key features (fit, comfort, durability, style, exclusivity). Relaxed loft for comfort. Textured industrial for durability. Fashion-forward environment for style. The setting tells the feature story.

3. TESTIMONIAL / REVIEW STYLE — Authentic real-life energy. Natural settings where real customers show off purchases: cafe, gym, travel, bedroom mirror, rooftop hangout. Candid natural lighting, warm tones, organic Instagram energy. Should feel like a happy customer post, not a shoot.

4. BUNDLE / OFFER BASED — Scroll-stopping visual impact. Moody dramatic backgrounds, spotlight-on-dark, rich accent colour glows, exclusive atmosphere. "Limited drop" and "premium collection" energy. Desire and urgency through visuals alone.

CRITICAL: Every single prompt must feel like a DIFFERENT creative concept. Do not repeat background types, colour palettes, or lighting setups across prompts. Push creative variety hard — 20 prompts should feel like 20 distinct ad concepts from a creative agency.

Return a JSON array of exactly 20 objects:
- "angle": one of "us_vs_them", "key_feature", "testimonial_review", "bundle_offer"
- "label": a short 2-5 word creative concept title
- "prompt_text": the full prompt (2-4 sentences, following the formula)

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
      "Generate 20 photorealistic ad image prompts (5 per category: US VS THEM, KEY FEATURE CALLOUTS, TESTIMONIAL/REVIEW STYLE, BUNDLE/OFFER BASED). Follow the prompt formula exactly. CRITICAL: Every prompt must be a visually DISTINCT concept — vary background type, colour palette, lighting style, and composition across all 20. No two prompts should feel similar. Use the brand's colours and energy but push creative variety hard. Each prompt: 2-4 sentences following the formula structure. Return ONLY the JSON array, no markdown."
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
        temperature: 0.85,
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
