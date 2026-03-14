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
      text: `You are a senior creative director analyzing reference images for an ad campaign. For each image, write a detailed 4-6 sentence analysis covering:

1. PRODUCT DETAILS: What exact product is shown? Describe logos, text, emblems, colours, materials, and design details you can see.
2. MODEL/STYLING: What is the person wearing? Describe layering, accessories, jewellery, hair, expression, pose direction.
3. SETTING & BACKGROUND: What environment or backdrop is used? Describe specific elements, colours, props.
4. LIGHTING & MOOD: What is the lighting style? What emotional energy does the image convey?
5. BRAND AESTHETIC: What is the overall brand vibe? (luxury, streetwear, patriotic, athletic, minimal, bold, etc.)
6. COLOUR PALETTE: List the dominant colours and how they work together.

Be extremely specific — mention exact colours (gold, navy, coral-pink), exact items (laurel wreath emblem, cable-knit cardigan), and exact moods (patriotic luxury, aspirational masculine energy). This analysis will be used to generate on-brand ad campaign prompts.`,
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

    const systemPrompt = `You are the creative director for a premium brand's ad campaign. You write detailed image-editing prompts for an AI photo editor. The AI takes a reference photo and edits ONLY the background, lighting, and mood — the product and person stay exactly the same.

YOUR JOB: Write prompts that read like a high-end campaign brief. Each prompt must be SPECIFIC, VIVID, and BRAND-AWARE. Use the image analysis and brand info provided to write prompts that feel tailored to THIS brand — not generic templates.

WHAT TO DESCRIBE (be extremely specific):
- The exact background/setting with specific visual details (not just "studio" but "studio with rich black voids and a single golden spotlight cutting through from above")
- The lighting mood and quality (golden hour rim lighting, dramatic side-lit shadows, soft diffused morning glow)
- The emotional energy and campaign feel (patriotic luxury, aspirational masculine confidence, rebellious streetwear energy)
- The composition style (heroic low-angle, intimate close crop, editorial wide shot)
- Photography style references (high-end editorial, professional product photography, cinematic portrait, fashion campaign)
- Depth of field and focus (shallow depth with bokeh, everything razor sharp, soft-focus background)

WHAT TO NEVER DO:
- NEVER describe the product, clothing, logos, or the person — the AI already sees them
- NEVER include Midjourney flags (--ar, --v, --q, --stylize)
- NEVER ask for text overlays, price tags, countdown timers, or any graphic design elements
- NEVER ask for split-screens, before/after composites, or collages
- NEVER use technical jargon like colour temperatures (4000K), f-stops, or softbox angles
- NEVER write generic prompts that could apply to any brand — make them SPECIFIC to this brand's aesthetic

PROMPT FORMAT: Each prompt should be 3-5 sentences. Start with "Keep the exact same product and outfit unchanged." then write the rest as a vivid creative brief.

QUALITY CHECK — every prompt must pass these tests:
1. Could a photographer read this and know EXACTLY what to shoot? If not, add more detail.
2. Does this feel tailored to THIS specific brand? If it could apply to any brand, rewrite it.
3. Does it have emotional energy? Words like "confident", "heroic", "rebellious", "aspirational"?
4. Does it specify the photography STYLE? "high-end editorial", "cinematic portrait", "fashion campaign"?

EXAMPLE of an excellent prompt:
"Keep the exact same product and outfit unchanged. Premium fashion campaign photo, massive American flag waving dramatically in soft-focus background filling the entire frame, golden hour sunlight casting warm cinematic rim lighting that wraps around the subject, shallow depth of field with the flag's red and blue colours melting into creamy bokeh, patriotic luxury streetwear vibe with heroic confident composition, the subject looking off to the side with powerful aspirational energy, high-end editorial style worthy of a magazine cover, high detail skin texture and fabric detail, vertical Instagram ad format"

EXAMPLE of a BAD generic prompt (do NOT write like this):
"Keep the exact same product and outfit unchanged. Set against a sleek urban wall under warm lighting with a confident vibe and editorial feel."
This is bad because it's vague, generic, has no specific details, and could apply to literally any brand.

Return a JSON array of exactly 20 objects:
- "angle": one of "product_hero", "ugc", "problem_solution", "lifestyle", "offer_urgency"
- "label": a short 2-4 word name
- "prompt_text": the detailed 3-5 sentence creative brief

Generate exactly 4 prompts per angle (4 x 5 = 20 total).

ANGLE GUIDELINES:
- product_hero: The hero shot. Premium studio or dramatic outdoor settings that make the product look like a million dollars. Think magazine covers, fashion billboards, campaign launch imagery. Dramatic lighting, powerful composition, the product commands attention.
- ugc: Authentic real-life moments. Someone naturally wearing/using the product — gym selfie, street corner, coffee run, hanging with friends. Should feel real and relatable but still polished enough for a sponsored Instagram post. Candid energy.
- problem_solution: Visual storytelling through contrast. Show the product in an environment that communicates uplift, transformation, or superiority — emerging from shadows into light, standing bold in a dull crowd, calm confidence in chaos. Use MOOD and ENVIRONMENT to tell the story, never text or split-screens.
- lifestyle: Aspirational dream scenes. Rooftop sunsets overlooking city skylines, coastal cliffside golden hour, first-class travel vibes, exclusive gym sessions. The product fits naturally into an elevated, desirable lifestyle the audience aspires to.
- offer_urgency: Maximum visual impact. Think bold dramatic lighting, striking colour contrasts, spotlight-on-black energy, neon-lit urban nights, high-contrast cinematic frames. Every element screams premium, exclusive, limited. The composition should make someone stop scrolling immediately.`;

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
      "Generate 20 rich, descriptive editing prompts (4 per angle). Each prompt should be 3-5 sentences painting a vivid, brand-specific creative brief for the final image's mood, lighting, composition, and energy. Remember: never describe the product or person, only the scene and vibe. Return ONLY the JSON array, no markdown."
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
