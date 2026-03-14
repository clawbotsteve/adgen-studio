// lib/prompt-engine.ts
// Ad-Ready Prompt Engine for Smart Batch
// Feature-flagged: set AD_PROMPT_ENGINE_ENABLED=false to disable

export type AngleKey =
  | "product_hero"
  | "ugc_testimonial"
  | "problem_solution"
  | "lifestyle_benefit"
  | "offer_urgency";

export interface AngleTemplate {
  key: AngleKey;
  label: string;
  description: string;
  promptTemplate: string;
}

export interface ClientBrain {
  brand_name?: string;
  product_name?: string;
  target_audience?: string;
  brand_tone?: string;
  brand_colors?: string;
  visual_style?: string;
  industry?: string;
  offer_type?: string;
  persona_type?: string;
  lifestyle_theme?: string;
  avoid_rules?: string;
}

export interface PromptEngineResult {
  angle_key: AngleKey;
  angle_label: string;
  final_prompt: string;
  negative_prompt: string;
  template_used: string;
}

// ── Reference-anchoring prefix ──
// This gets prepended to EVERY prompt to tell the model to preserve the reference image subject
const REFERENCE_ANCHOR =
  "Keep the exact product, subject, logos, brand details, and design from the reference image completely unchanged. " +
  "Do not alter, redesign, or reimagine the product itself. Only modify the environment, background, lighting, and mood around it.";

export const GLOBAL_NEGATIVE_PROMPT =
  "low quality, blurry, overprocessed skin, deformed hands, extra fingers, bad anatomy, " +
  "warped product shape, noisy background, cluttered composition, cartoon look, fake CGI look, " +
  "unreadable text, watermark, logo distortion, " +
  "altered product design, changed logo, modified brand details, different product shape, " +
  "missing brand elements, redesigned product, wrong product color";

const BASE_AD_QUALITY =
  "Professional advertising photography, commercial grade, Instagram-ready, brand-safe";

export const ANGLE_TEMPLATES: AngleTemplate[] = [
  {
    key: "product_hero",
    label: "Product Hero",
    description: "Bold product-focused hero shot with the exact reference product",
    promptTemplate:
      "Edit this image to place the exact same product in a premium studio environment. " +
      "Clean, minimal background in {{brand_colors}} tones. " +
      "Bold studio lighting with soft shadows to highlight product details. " +
      "Product is centered and prominent, shot straight-on or at a slight angle. " +
      "Style: {{visual_style}}. The mood is {{brand_tone}}. " +
      "Do not change the product — only the background and lighting.",
  },
  {
    key: "ugc_testimonial",
    label: "UGC",
    description: "User-generated content style with the exact reference product",
    promptTemplate:
      "Edit this image to give it an authentic, candid, user-generated content feel. " +
      "Place the exact same product in a natural, everyday setting — someone using or wearing it casually. " +
      "Warm natural lighting, slightly imperfect framing like a real phone photo. " +
      "Relatable lifestyle setting for {{target_audience}}. " +
      "Style: casual and authentic. Keep all product details, logos, and branding exactly as they are.",
  },
  {
    key: "problem_solution",
    label: "Problem/Solution",
    description: "Transformation or problem-solving visual with the exact reference product",
    promptTemplate:
      "Edit this image to show the exact same product as the clear hero solution. " +
      "Create a visual context in the {{industry}} space where the product stands out as the answer. " +
      "Dramatic, confident lighting that draws attention to the product. " +
      "Background suggests transformation or improvement. " +
      "Colors: {{brand_colors}}. Style: {{visual_style}}. Tone: {{brand_tone}}. " +
      "The product itself must remain completely unchanged.",
  },
  {
    key: "lifestyle_benefit",
    label: "Lifestyle",
    description: "Aspirational lifestyle scene with the exact reference product",
    promptTemplate:
      "Edit this image to place the exact same product in a {{lifestyle_theme}} lifestyle scene. " +
      "Aspirational, editorial-quality setting that appeals to {{target_audience}}. " +
      "Golden hour or natural window lighting, cinematic depth of field. " +
      "The product is featured naturally in the scene, not staged. " +
      "Colors complement {{brand_colors}}. Style: {{visual_style}}. " +
      "Keep every detail of the product identical to the reference.",
  },
  {
    key: "offer_urgency",
    label: "Offer/Urgency",
    description: "Eye-catching promotional creative with the exact reference product",
    promptTemplate:
      "Edit this image to create an eye-catching, high-energy promotional feel. " +
      "Keep the exact same product but place it against a bold, dynamic background. " +
      "High contrast, punchy colors using {{brand_colors}}. " +
      "Dramatic lighting with strong highlights and shadows for visual impact. " +
      "Designed to grab attention for {{target_audience}}. Tone: {{brand_tone}}. " +
      "The product must remain exactly as shown in the reference — only the environment changes.",
  },
];

// ── Auto-mix distribution ──
const AUTOMIX_DISTRIBUTIONS: Record<number, Record<AngleKey, number>> = {
  5: { product_hero: 1, ugc_testimonial: 1, problem_solution: 1, lifestyle_benefit: 1, offer_urgency: 1 },
  10: { product_hero: 3, ugc_testimonial: 2, problem_solution: 2, lifestyle_benefit: 2, offer_urgency: 1 },
  15: { product_hero: 4, ugc_testimonial: 3, problem_solution: 3, lifestyle_benefit: 3, offer_urgency: 2 },
  20: { product_hero: 5, ugc_testimonial: 4, problem_solution: 4, lifestyle_benefit: 4, offer_urgency: 3 },
  30: { product_hero: 8, ugc_testimonial: 6, problem_solution: 6, lifestyle_benefit: 6, offer_urgency: 4 },
  50: { product_hero: 14, ugc_testimonial: 10, problem_solution: 10, lifestyle_benefit: 10, offer_urgency: 6 },
};

const DEFAULT_RATIOS: Record<AngleKey, number> = {
  product_hero: 0.28,
  ugc_testimonial: 0.20,
  problem_solution: 0.20,
  lifestyle_benefit: 0.20,
  offer_urgency: 0.12,
};

/**
 * Get the angle distribution for a given quantity.
 */
export function getAngleDistribution(
  quantity: number,
  selectedAngles?: AngleKey[],
  lockToSelected?: boolean
): AngleKey[] {
  let angles: AngleKey[];

  if (selectedAngles && selectedAngles.length > 0 && lockToSelected) {
    // Lock mode: only use selected angles
    angles = [];
    const perAngle = Math.floor(quantity / selectedAngles.length);
    const remainder = quantity % selectedAngles.length;
    for (let i = 0; i < selectedAngles.length; i++) {
      const count = perAngle + (i < remainder ? 1 : 0);
      for (let j = 0; j < count; j++) angles.push(selectedAngles[i]);
    }
  } else if (selectedAngles && selectedAngles.length > 0) {
    // Bias mode: favor selected angles but include others
    const allAngles: AngleKey[] = [
      "product_hero", "ugc_testimonial", "problem_solution",
      "lifestyle_benefit", "offer_urgency",
    ];
    const biasedRatios: Record<AngleKey, number> = { ...DEFAULT_RATIOS };
    const selectedSet = new Set(selectedAngles);
    for (const key of allAngles) {
      if (selectedSet.has(key)) biasedRatios[key] *= 1.5;
      else biasedRatios[key] *= 0.5;
    }
    const total = Object.values(biasedRatios).reduce((a, b) => a + b, 0);
    angles = [];
    let remaining = quantity;
    const sorted = allAngles.sort((a, b) => biasedRatios[b] - biasedRatios[a]);
    for (let i = 0; i < sorted.length; i++) {
      const count =
        i === sorted.length - 1
          ? remaining
          : Math.round((biasedRatios[sorted[i]] / total) * quantity);
      for (let j = 0; j < Math.min(count, remaining); j++)
        angles.push(sorted[i]);
      remaining -= Math.min(count, remaining);
    }
  } else {
    // Auto-mix mode
    const predefined = AUTOMIX_DISTRIBUTIONS[quantity];
    if (predefined) {
      angles = [];
      for (const [key, count] of Object.entries(predefined)) {
        for (let i = 0; i < count; i++) angles.push(key as AngleKey);
      }
    } else {
      const allAngles: AngleKey[] = [
        "product_hero", "ugc_testimonial", "problem_solution",
        "lifestyle_benefit", "offer_urgency",
      ];
      angles = [];
      let remaining = quantity;
      for (let i = 0; i < allAngles.length; i++) {
        const count =
          i === allAngles.length - 1
            ? remaining
            : Math.round(DEFAULT_RATIOS[allAngles[i]] * quantity);
        for (let j = 0; j < Math.min(count, remaining); j++)
          angles.push(allAngles[i]);
        remaining -= Math.min(count, remaining);
      }
    }
  }

  // Shuffle for variety (Fisher-Yates)
  for (let i = angles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [angles[i], angles[j]] = [angles[j], angles[i]];
  }

  return angles;
}

/**
 * Interpolate template variables from client brain data.
 */
function interpolate(template: string, brain: ClientBrain): string {
  const defaults: Record<string, string> = {
    brand_name: "the brand",
    product_name: "the product",
    target_audience: "modern consumers",
    brand_tone: "professional and confident",
    brand_colors: "brand signature",
    visual_style: "clean modern aesthetic",
    industry: "consumer goods",
    offer_type: "limited-time",
    persona_type: "everyday person",
    lifestyle_theme: "modern aspirational",
  };

  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const brainVal = brain[key as keyof ClientBrain];
    if (brainVal && brainVal.trim().length > 0) return brainVal.trim();
    return defaults[key] || key;
  });
}

/**
 * Compose the final prompt for a single generation item.
 * Now includes reference-anchoring prefix to preserve the original product.
 */
export function composePrompt(
  angleKey: AngleKey,
  brain: ClientBrain,
  campaignContext?: string
): PromptEngineResult {
  const template = ANGLE_TEMPLATES.find((t) => t.key === angleKey);
  if (!template) {
    return composePrompt("product_hero", brain, campaignContext);
  }

  const anglePrompt = interpolate(template.promptTemplate, brain);

  // Build final prompt: Reference anchor first, then quality, then angle-specific
  const parts = [REFERENCE_ANCHOR, BASE_AD_QUALITY, anglePrompt];

  if (campaignContext && campaignContext.trim().length > 0) {
    parts.push("Additional context: " + campaignContext.trim());
  }

  const finalPrompt = parts.join(". ");

  // Build negative prompt
  let negativePrompt = GLOBAL_NEGATIVE_PROMPT;
  if (brain.avoid_rules && brain.avoid_rules.trim().length > 0) {
    negativePrompt += ", " + brain.avoid_rules.trim();
  }

  return {
    angle_key: angleKey,
    angle_label: template.label,
    final_prompt: finalPrompt,
    negative_prompt: negativePrompt,
    template_used: template.key,
  };
}

/**
 * Check if the prompt engine is enabled.
 */
export function isPromptEngineEnabled(): boolean {
  const flag = process.env.AD_PROMPT_ENGINE_ENABLED;
  return flag !== "false";
}

/**
 * Build client brain from brand context and profile data.
 */
export function buildClientBrain(
  brandContext: Record<string, unknown> | null,
  profile?: Record<string, unknown> | null
): ClientBrain {
  if (!brandContext) return {};

  return {
    brand_name: String(brandContext.brand_name || brandContext.name || ""),
    product_name: String(brandContext.product_name || brandContext.product || ""),
    target_audience: String(brandContext.target_audience || brandContext.audience || ""),
    brand_tone: String(brandContext.brand_tone || brandContext.tone || ""),
    brand_colors: String(brandContext.brand_colors || brandContext.colors || ""),
    visual_style: String(
      brandContext.visual_style || brandContext.style || profile?.visual_style || ""
    ),
    industry: String(brandContext.industry || ""),
    offer_type: String(brandContext.offer_type || "limited-time"),
    persona_type: String(brandContext.persona_type || "everyday person"),
    lifestyle_theme: String(brandContext.lifestyle_theme || "modern aspirational"),
    avoid_rules: String(brandContext.avoid_rules || brandContext.negative_keywords || ""),
  };
}