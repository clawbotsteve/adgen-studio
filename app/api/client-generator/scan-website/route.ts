import { NextResponse } from "next/server";
import { requireUserTenantApi } from "@/lib/auth";

// ── Helper: strip HTML tags and clean text ──
function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, " [HEADER] ")
    .replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, "\n## $1\n")
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "- $1\n")
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "\n$1\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n")
    .trim();
}

// ── Helper: extract meta tags ──
function extractMeta(html: string): Record<string, string> {
  const meta: Record<string, string> = {};

  // Title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) meta.title = titleMatch[1].trim();

  // Meta description
  const descMatch = html.match(
    /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i
  );
  if (descMatch) meta.description = descMatch[1];

  // OG tags
  const ogPatterns = [
    { key: "og:title", name: "ogTitle" },
    { key: "og:description", name: "ogDescription" },
    { key: "og:site_name", name: "ogSiteName" },
  ];
  for (const { key, name } of ogPatterns) {
    const match = html.match(
      new RegExp(
        `<meta[^>]*property=["']${key}["'][^>]*content=["']([^"']+)["']`,
        "i"
      )
    );
    if (match) meta[name] = match[1];
  }

  // Theme color
  const themeMatch = html.match(
    /<meta[^>]*name=["']theme-color["'][^>]*content=["']([^"']+)["']/i
  );
  if (themeMatch) meta.themeColor = themeMatch[1];

  return meta;
}

// ── Helper: extract colors from CSS/HTML ──
function extractColors(html: string): string[] {
  const colorSet = new Set<string>();

  // Hex colors from inline styles and CSS
  const hexMatches = html.match(/#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g);
  if (hexMatches) {
    for (const hex of hexMatches) {
      const normalized = hex.toUpperCase();
      // Skip very common defaults
      if (!["#FFF", "#FFFFFF", "#000", "#000000", "#333", "#333333", "#666", "#666666", "#999", "#999999", "#CCC", "#CCCCCC", "#EEE", "#EEEEEE"].includes(normalized)) {
        colorSet.add(normalized.length === 4
          ? `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`
          : normalized);
      }
    }
  }

  // CSS custom properties that look like brand colors
  const varMatches = html.match(/--(?:brand|primary|accent|theme|color)[^:]*:\s*([^;]+)/gi);
  if (varMatches) {
    for (const v of varMatches) {
      const valMatch = v.match(/#[0-9a-fA-F]{3,6}/);
      if (valMatch) colorSet.add(valMatch[0].toUpperCase());
    }
  }

  return Array.from(colorSet).slice(0, 15);
}

// ── Helper: fetch a URL safely with timeout ──
async function safeFetch(url: string, timeoutMs = 8000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AdGenStudio/1.0; brand-analyzer)",
        Accept: "text/html,application/xhtml+xml,*/*",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const text = await res.text();
    return text;
  } catch {
    return null;
  }
}

// ── Main: scrape multiple pages then analyze with Grok ──
export async function POST(request: Request) {
  try {
    await requireUserTenantApi();
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const grokKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
    if (!grokKey) {
      return NextResponse.json(
        { error: "AI API key not configured" },
        { status: 500 }
      );
    }

    // ── Step 1: Normalize the base URL ──
    let baseUrl = url.trim();
    if (!baseUrl.startsWith("http")) baseUrl = "https://" + baseUrl;
    baseUrl = baseUrl.replace(/\/+$/, "");

    // ── Step 2: Scrape the homepage ──
    const homepageHtml = await safeFetch(baseUrl);
    if (!homepageHtml) {
      return NextResponse.json(
        { error: "Could not reach website. Check the URL and try again." },
        { status: 400 }
      );
    }

    const meta = extractMeta(homepageHtml);
    const cssColors = extractColors(homepageHtml);
    const homepageText = stripHtml(homepageHtml).slice(0, 4000);

    // ── Step 3: Try to scrape additional pages ──
    const subpages = [
      "/about",
      "/pages/about",
      "/pages/about-us",
      "/about-us",
      "/collections",
      "/pages/our-story",
      "/story",
    ];

    const subpageTexts: string[] = [];
    const fetches = subpages.map(async (path) => {
      const html = await safeFetch(baseUrl + path, 6000);
      if (html) {
        const text = stripHtml(html).slice(0, 2000);
        if (text.length > 100) {
          subpageTexts.push(`[${path}]: ${text}`);
        }
      }
    });
    await Promise.all(fetches);

    // ── Step 4: Build the context for Grok ──
    const scrapedContext = [
      `URL: ${baseUrl}`,
      meta.title ? `Page Title: ${meta.title}` : "",
      meta.description ? `Meta Description: ${meta.description}` : "",
      meta.ogDescription ? `OG Description: ${meta.ogDescription}` : "",
      meta.ogSiteName ? `Site Name: ${meta.ogSiteName}` : "",
      meta.themeColor ? `Theme Color: ${meta.themeColor}` : "",
      cssColors.length > 0 ? `Colors found in CSS: ${cssColors.join(", ")}` : "",
      `\n--- HOMEPAGE CONTENT ---\n${homepageText}`,
      ...subpageTexts.map((t) => `\n--- SUBPAGE ---\n${t}`),
    ]
      .filter(Boolean)
      .join("\n");

    // Trim to stay within token limits
    const trimmedContext = scrapedContext.slice(0, 12000);

    // ── Step 5: Send to Grok with rich prompt ──
    const systemPrompt = `You are an expert brand strategist and creative director. You have been given scraped content from a brand's website. Your job is to deeply analyze this content and extract a comprehensive brand profile.

IMPORTANT: Base your analysis ONLY on the actual scraped content provided. Do not guess or hallucinate information not present in the content.

Return a JSON object with ALL of these fields:

{
  "productName": "The brand or company name",
  "productDescription": "A rich 2-4 sentence brand description that captures the brand's identity, ethos, and what makes them unique. Write it like a brand strategist — not just 'they sell X' but capture the energy, positioning, and story. Think about who they are, why they exist, and what they stand for.",
  "usp": "The unique selling proposition — what sets this brand apart from competitors. Be specific based on what you see in their messaging.",
  "brandColors": "A text description of the brand's color palette (e.g. 'Black, gray, white with pops of red and neon accents for energy')",
  "colors": [{"hex": "#000000", "label": "Black"}, {"hex": "#FF4500", "label": "Neon Orange"}],
  "visualStyle": "MUST be exactly one of: Clean & Minimal, Bold & Vibrant, Editorial / Magazine, Dark & Moody, Bright & Airy, Luxury / Premium, Playful & Fun, Natural & Organic, Urban / Street, Retro / Vintage",
  "moodTone": "3-5 descriptive words capturing the brand's mood and tone (e.g. 'Edgy, Bold, Urban, Confident')",
  "targetAudience": "A detailed 2-3 sentence description of the target audience. Include age range, interests, lifestyle, values, and what motivates them. Be specific — not just 'young adults' but paint a picture of who these people are.",
  "font": "A suggested display font name that best matches the brand aesthetic. Choose from: Inter, Montserrat, Poppins, Roboto, Open Sans, Playfair Display, Raleway, Oswald, Lato, DM Sans, Bebas Neue, Work Sans, Space Grotesk, Nunito. Pick the one that BEST fits the brand's visual identity.",
  "moreOfThis": "Creative direction for ad generation — what visual/messaging elements should be emphasized based on the brand identity (e.g. 'Bold product shots, lifestyle imagery, urban settings, strong typography, aspirational messaging')",
  "lessOfThat": "What to avoid in ad generation based on brand identity (e.g. 'Stock photo feel, corporate language, cluttered layouts, pastel colors, generic messaging')"
}

Extract 3-8 primary brand colors for the "colors" array. If you can identify colors from the CSS data provided, use those. Otherwise infer from the brand's visual identity.

Return ONLY valid JSON. No markdown, no explanation, no code fences.`;

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
            content: `Analyze this brand based on the following scraped website data and extract a complete brand profile:\n\n${trimmedContext}`,
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

    // ── Step 6: Parse and return ──
    try {
      const cleanContent = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      const result = JSON.parse(cleanContent);

      // Merge CSS-extracted colors if Grok didn't find enough
      if (
        (!result.colors || result.colors.length < 3) &&
        cssColors.length > 0
      ) {
        const existing = new Set(
          (result.colors || []).map((c: { hex: string }) =>
            c.hex.toUpperCase()
          )
        );
        const extras = cssColors
          .filter((c) => !existing.has(c))
          .slice(0, 5)
          .map((hex) => ({ hex, label: "" }));
        result.colors = [...(result.colors || []), ...extras];
      }

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
