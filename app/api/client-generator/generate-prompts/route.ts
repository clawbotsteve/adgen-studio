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
      text: `Analyze each uploaded image in extreme detail. For each image describe:
- Main product(s) visible: exact item, colours, textures, materials, visible logos/text/emblems
- Model (if any): age range, pose, expression, clothing details, layering, accessories, hair
- Background and setting: environment, props, colours, surfaces
- Lighting: style, direction, mood it creates
- Overall vibe: premium, everyday, wellness, cozy, energetic, patriotic, streetwear, etc.
- Visible branding: any brand name, tagline, or logo text you can read
- Colour palette: list dominant colours and how they interact

Be extremely specific. Say "gold laurel-wreath emblem on navy polo" not "logo on shirt". Say "warm golden hour side-lighting with long shadows" not "nice lighting". This analysis will be used to generate high-conversion ad prompts.`,
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

    /* ── Generate 20 high-conversion ad prompts via Grok ── */

    const systemPrompt = `You are an expert AI prompt engineer for high-conversion social media ad visuals (Instagram, TikTok, Facebook). You have been given a detailed analysis of reference product images and brand info. Your job is to generate optimized image-editing prompts that an AI photo editor will use to transform the reference photos into scroll-stopping ads.

HOW THE AI PHOTO EDITOR WORKS:
- It takes the original reference photo and edits ONLY the background, lighting, mood, and environment
- The product, person, clothing, and logos stay EXACTLY the same — never describe these
- Your prompts should describe the SCENE, SETTING, LIGHTING, and VISUAL CONCEPT for the final ad image

CORE RULES:
1. Use the image analysis provided to understand the exact product, brand aesthetic, colours, and vibe. Reference these specifics in every prompt.
2. Use the exact brand name if provided in the brand info. Otherwise use the brand vibe naturally.
3. Every prompt must describe a specific, vivid visual scene — not generic photography directions.
4. Write prompts that a social media ad manager would use. Think "what would make someone stop scrolling and tap" not "what would a photographer set up."
5. Each prompt should be 2-4 sentences. Be vivid and specific but concise.
6. NEVER describe the product, clothing, logos, or the person — the AI already sees them in the reference photo.
7. NEVER include Midjourney flags (--ar, --v, --q, --stylize).
8. NEVER ask for text overlays, price tags, captions, or any graphic design elements — this is a photo editor, not a graphic design tool.
9. NEVER ask for split-screens, before/after composites, collages, or multiple panels.
10. NEVER use technical jargon like colour temperatures (4000K), f-stops, or softbox specs.

PROMPT STRUCTURE: Start each prompt with "Keep the exact same product and outfit unchanged." Then describe the visual ad concept — the background, environment, lighting, mood, and the feeling the ad should evoke.

AD CATEGORIES — generate exactly 5 prompts for each:

1. US VS THEM — Show visual superiority. The product/person should look elevated, premium, and dominant compared to the implied competition. Think: bold dramatic backdrops that scream quality, environments that make cheap alternatives look invisible, lighting that says "this is the real deal." The visual should communicate "why settle for less?"

2. KEY FEATURE CALLOUTS — Highlight what makes this product special through the visual environment. If it's premium materials, show luxurious settings that match. If it's durability, show rugged environments. If it's style, show fashion-forward scenes. The background and mood should REINFORCE the product's key selling point without any text needed.

3. TESTIMONIAL / REVIEW STYLE — Create authentic, trustworthy scenes that feel like a real customer showing off their purchase. Think: natural environments, genuine candid energy, relatable settings (home, street, gym, coffee shop). The vibe should say "I love this product and want to show it off." Real-person energy, not studio-polished.

4. BUNDLE / OFFER BASED — Maximum visual impact designed to stop the scroll. Think: bold dramatic lighting, striking colour contrasts, premium spotlight-on-dark setups, cinematic frames. Every element should scream exclusive, limited, premium. The composition should create urgency and desire — make the viewer feel like they need to act now.

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
      "Generate 20 high-conversion ad image prompts (5 per category: US VS THEM, KEY FEATURE CALLOUTS, TESTIMONIAL/REVIEW STYLE, BUNDLE/OFFER BASED). Each prompt should be 2-4 sentences describing the visual scene, background, lighting, and mood for the ad. Never describe the product or person — only the environment and vibe. Return ONLY the JSON array, no markdown."
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
