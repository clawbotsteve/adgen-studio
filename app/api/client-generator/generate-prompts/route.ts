import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { getClient, updateClient } from "@/lib/data/clients";
import { listTopCreatives } from "@/lib/data/top-creatives";
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
 * Step 1: Analyze top creative images with Grok Vision.
 * Returns a detailed technical description of what is in the images.
 */
async function analyzeImages(
  imageUrls: string[],
  apiKey: string
): Promise<string> {
  if (imageUrls.length === 0) return "";

  // Send up to 5 images to Grok vision
  const imagesToAnalyze = imageUrls.slice(0, 5);

  const imageContent = imagesToAnalyze.map((url) => ({
    type: "image_url" as const,
    image_url: { url },
  }));

  const visionResponse = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4-latest",
      messages: [
        {
          role: "user",
          content: [
            ...imageContent,
            {
              type: "text",
              text: `Analyze these product/brand reference images. For each image, describe in precise technical detail:

1. SUBJECT: What is the main product? Describe it exactly (type, color, material, logos, text, design details)
2. MODEL/PERSON: If a person is present, describe their pose, styling, clothing, expression
3. SETTING: Current background, environment, location
4. LIGHTING: Current lighting setup (direction, quality, color temperature)
5. COLOR PALETTE: Dominant colors in the image
6. COMPOSITION: Camera angle, framing, depth of field
7. MOOD: Overall aesthetic feel

Be extremely specific and technical. This description will be used to write image editing prompts that need to preserve the exact product while changing the environment.`,
            },
          ],
        },
      ],
      temperature: 0.3,
    }),
  });

  if (!visionResponse.ok) {
    console.error("[generate-prompts] Vision analysis failed:", visionResponse.status);
    return "";
  }

  const visionData = await visionResponse.json();
  return visionData.choices?.[0]?.message?.content?.trim() ?? "";
}

/**
 * POST /api/client-generator/generate-prompts
 * 
 * Flow:
 * 1. Load top creative images for this client
 * 2. Analyze images with Grok Vision to get technical descriptions
 * 3. Generate 20 editing prompts using brand data + image descriptions
 * 4. Save prompts to client defaults
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

    // ── Step 1: Load top creatives and analyze with vision ──
    const topCreatives = await listTopCreatives(auth.tenant.id, body.clientId);
    const imageUrls = topCreatives.map((tc) => tc.url);

    let imageAnalysis = "";
    if (imageUrls.length > 0) {
      console.log("[generate-prompts] Analyzing " + imageUrls.length + " top creative images with vision...");
      try {
        imageAnalysis = await analyzeImages(imageUrls, apiKey);
        console.log("[generate-prompts] Vision analysis complete: " + imageAnalysis.length + " chars");
      } catch (visionErr) {
        console.warn("[generate-prompts] Vision analysis failed, continuing without:", visionErr);
      }
    }

    // ── Step 2: Build brand context ──
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

    if (!fullContext.trim() && !imageAnalysis) {
      return NextResponse.json(
        { error: "No brand data or reference images found. Please fill in Product Info and upload Top Creatives." },
        { status: 400 }
      );
    }

    // ── Step 3: Generate prompts with Grok ──
    const angleDescriptions = ANGLES.map(a => a.key + " (" + a.label + "): " + a.count + " prompts").join("\n");

    const systemPrompt = `You are a senior photo retoucher writing technical editing briefs for an AI image editing model.

The AI model receives a REFERENCE PHOTO and your editing instructions. It keeps the subject/product from the reference photo and changes everything else based on your instructions.

YOUR RULES:
- You have seen the reference images (analysis provided below). Base your prompts on what is ACTUALLY in those photos.
- Write like a retoucher briefing an assistant: specific, technical, no fluff.
- NEVER describe the product/subject — the model already has the photo. Only describe what CHANGES.
- Every prompt must specify these 4 things:
  1. BACKGROUND: Exact new background (be specific — "weathered red brick wall" not "urban setting")
  2. LIGHTING: Exact setup (direction, quality, color temp — "single softbox 45deg camera-left, warm 4000K" not "dramatic lighting")
  3. COLOR GRADE: Specific treatment ("desaturate background 20%, warm shadows, cool highlights" not "moody tones")
  4. FRAMING: Any crop or angle adjustments ("tight crop chest-up, slight low angle" or "keep original framing")
- End every prompt with "Keep the subject exactly as-is from the reference."
- Each prompt should be 2-3 sentences max. Dense and specific, zero filler words.`;

    let userPromptParts = [
      "Generate exactly 20 image editing prompts, distributed as follows:",
      angleDescriptions,
      "",
      "Brand data:",
      fullContext,
    ];

    if (imageAnalysis) {
      userPromptParts.push(
        "",
        "=== REFERENCE IMAGE ANALYSIS ===",
        imageAnalysis,
        "=== END ANALYSIS ===",
        "",
        "IMPORTANT: Your prompts must be grounded in what is ACTUALLY shown in these reference images.",
        "The editing model will receive one of these exact images as input.",
        "Write prompts that make sense for what is in the photos."
      );
    }

    userPromptParts.push(
      "",
      "Return ONLY a JSON array of 20 objects:",
      '- "angle": one of "product_hero", "ugc_testimonial", "problem_solution", "lifestyle_benefit", "offer_urgency"',
      '- "concept": 2-5 word name for the specific vibe (e.g. "Rooftop Golden Hour", "Concrete Studio Minimal")',
      '- "prompt_text": the technical editing brief (2-3 sentences)',
      '- "tags": 2-4 relevant tags',
      "",
      "JSON array only. No markdown. No explanation."
    );

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
          { role: "user", content: userPromptParts.join("\n") },
        ],
        temperature: 0.7,
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

    // ── Step 4: Save to client defaults ──
    const currentDefaults = (client.defaults as Record<string, unknown>) || {};
    await updateClient(auth.tenant.id, body.clientId, {
      defaults: {
        ...currentDefaults,
        generatedPrompts: prompts,
        promptsGeneratedAt: new Date().toISOString(),
        imageAnalysis: imageAnalysis ? imageAnalysis.slice(0, 5000) : null,
      } as Record<string, unknown>,
    });

    return NextResponse.json({
      prompts,
      count: prompts.length,
      imagesAnalyzed: imageUrls.length,
    });
  } catch (error) {
    console.error("[generate-prompts] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate prompts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}