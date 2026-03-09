import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";
import { assertTenantUser } from "@/lib/access";
import { createPromptPack, bulkCreatePromptItems } from "@/lib/data/prompts";

interface GeneratedPrompt {
  concept: string;
  prompt_text: string;
  tags: string[];
}

export async function POST(request: Request) {
  const auth = await requireUserTenantApi();
  if ("error" in auth)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  const allowed = await assertTenantUser(auth.tenant.id, auth.user.id);
  if (!allowed)
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = (await request.json()) as {
    brief: string;
    count?: number;
    packName?: string;
  };

  if (!body.brief?.trim()) {
    return NextResponse.json(
      { error: "Brief is required" },
      { status: 400 }
    );
  }

  const count = Math.min(Math.max(body.count || 20, 5), 50);
  const apiKey = process.env.GROK_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Grok API key not configured. Add GROK_API_KEY to your environment variables." },
      { status: 500 }
    );
  }

  try {
    // Call xAI Grok API to generate prompts
    const systemPrompt = `You are an expert AI image prompt engineer for advertising and e-commerce creative production.
You generate detailed, production-ready image generation prompts based on creative briefs.

Each prompt should include:
- A short "concept" name (2-5 words describing the shot type or angle)
- A detailed "prompt_text" that an AI image generator can use to create the image
- Relevant "tags" for categorization

Your prompts should cover a variety of:
- Camera angles (front, side, overhead, low angle, close-up, wide)
- Lighting styles (natural, studio, dramatic, soft, golden hour)
- Compositions (hero shot, lifestyle, flat lay, detail, action)
- Settings/backgrounds appropriate to the brief

Make each prompt unique and varied. Include specific details about styling, mood, props, and environment.
The prompt_text should be 1-3 sentences, detailed enough for high-quality AI image generation.`;

    const userPrompt = `Generate exactly ${count} image generation prompts based on this creative brief:

"${body.brief.trim()}"

Respond with ONLY a JSON array of objects, each with "concept" (string), "prompt_text" (string), and "tags" (string array). No markdown, no explanation, just the JSON array.

Example format:
[{"concept":"Hero Front Shot","prompt_text":"A professional studio photograph of...","tags":["studio","front","hero"]}]`;
    const grokResponse = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-3-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
      }),
    });

    if (!grokResponse.ok) {
      const errText = await grokResponse.text();
      console.error("[generate] Grok API error:", grokResponse.status, errText);
      return NextResponse.json(
        {
          error: "Failed to generate prompts from AI",
          detail: `Grok API returned ${grokResponse.status}`,
        },
        { status: 502 }
      );
    }

    const grokData = await grokResponse.json();
    const rawContent =
      grokData.choices?.[0]?.message?.content?.trim() ?? "";

    // Parse the JSON response — strip markdown fences if present
    let cleaned = rawContent;
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let generatedPrompts: GeneratedPrompt[];
    try {
      generatedPrompts = JSON.parse(cleaned);
    } catch {
      console.error("[generate] Failed to parse Grok response:", rawContent.substring(0, 500));
      return NextResponse.json(
        {
          error: "Failed to parse AI response",
          detail: "The AI returned an unexpected format. Please try again.",
        },
        { status: 502 }
      );
    }
    // Validate the array
    if (!Array.isArray(generatedPrompts) || generatedPrompts.length === 0) {
      return NextResponse.json(
        { error: "AI returned empty results. Please try again." },
        { status: 502 }
      );
    }

    // Sanitize each prompt
    const validPrompts = generatedPrompts
      .filter((p) => p.concept && p.prompt_text)
      .map((p) => ({
        concept: String(p.concept).slice(0, 200),
        prompt_text: String(p.prompt_text).slice(0, 2000),
        tags: Array.isArray(p.tags)
          ? p.tags.map((t: unknown) => String(t)).slice(0, 10)
          : [],
      }));

    if (validPrompts.length === 0) {
      return NextResponse.json(
        { error: "AI did not return any valid prompts" },
        { status: 502 }
      );
    }

    // Create the prompt pack
    const packName =
      body.packName?.trim() ||
      `AI Generated — ${body.brief.trim().slice(0, 40)}`;

    const pack = await createPromptPack(auth.tenant.id, {
      name: packName,
      description: body.brief.trim(),
      tags: ["ai-generated"],
    });

    // Bulk create all generated items
    const itemCount = await bulkCreatePromptItems(pack.id, validPrompts);

    return NextResponse.json(
      {
        pack,
        itemCount,
        promptCount: validPrompts.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[generate POST]", error);
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to generate prompts", detail: message },
      { status: 500 }
    );
  }
}
