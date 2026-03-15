import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    await requireUserTenantApi();

    const { url } = await request.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Use Grok API to analyze the website
    const grokKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
    if (!grokKey) {
      return NextResponse.json(
        { error: "AI API key not configured" },
        { status: 500 }
      );
    }

    const systemPrompt = `You are a brand analyst AI. Given a website URL, research and extract brand information. Return a JSON object with these fields:
- productName: The brand or product name
- productDescription: A 1-2 sentence description of what the brand/product does
- usp: The unique selling proposition
- brandColors: A text description of the brand's color palette (e.g. "Deep navy, gold, off-white")
- colors: An array of color objects [{hex: "#hexcode", label: "color name"}] - extract 3-6 primary brand colors
- visualStyle: One of: "Clean & Minimal", "Bold & Vibrant", "Editorial / Magazine", "Dark & Moody", "Bright & Airy", "Luxury / Premium", "Playful & Fun", "Natural & Organic", "Urban / Street", "Retro / Vintage"
- moodTone: The brand's mood/tone in 3-5 words
- targetAudience: A brief description of the target audience
- font: A suggested display font name that matches the brand's style

Return ONLY valid JSON, no markdown or explanation.`;

    const grokRes = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${grokKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-3-mini",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Analyze this brand website and extract brand data: ${url}`,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!grokRes.ok) {
      console.error("Grok API error:", await grokRes.text());
      return NextResponse.json(
        { error: "AI analysis failed" },
        { status: 500 }
      );
    }

    const grokData = await grokRes.json();
    const content = grokData.choices?.[0]?.message?.content || "";

    // Parse the JSON response
    try {
      // Remove potential markdown code fences
      const cleanContent = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      const result = JSON.parse(cleanContent);
      return NextResponse.json(result);
    } catch {
      console.error("Failed to parse Grok response:", content);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error("Scan website error:", error);
    return NextResponse.json(
      { error: "Failed to scan website" },
      { status: 500 }
    );
  }
}
