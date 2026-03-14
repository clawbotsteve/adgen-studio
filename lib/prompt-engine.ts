// lib/prompt-engine.ts
// Ad-Ready Prompt Engine for Smart Batch
// Feature-flagged: set AD_PROMPT_ENGINE_ENABLED=false to disable

export type AngleKey = "product_hero" | "ugc_testimonial" | "problem_solution" | "lifestyle_benefit" | "offer_urgency";

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
export const GLOBAL_NEGATIVE_PROMPT = "low quality, blurry, overprocessed skin, deformed hands, extra fingers, bad anatomy, warped product shape, noisy background, cluttered composition, cartoon look, fake CGI look, unreadable text, watermark, logo distortion";

const BASE_AD_QUALITY = "Professional high-quality advertising photography, studio lighting, commercial grade, Instagram-ready, clean composition, brand-safe";

export const ANGLE_TEMPLATES: AngleTemplate[] = [
  {
    key: "product_hero",
    label: "Product Hero",
    description: "Bold product-focused hero shot",
    promptTemplate: "Hero product shot of {{product_name}} by {{brand_name}}. Premium studio lighting, clean background, product centered and prominent. Shot for {{target_audience}}. Style: {{visual_style}}. Tone: {{brand_tone}}. Colors: {{brand_colors}}.",
  },
  {
    key: "ugc_testimonial",
    label: "UGC",
    description: "User-generated content style testimonial",
    promptTemplate: "Authentic user-generated content style photo showing a {{persona_type}} naturally using {{product_name}} by {{brand_name}}. Candid, relatable feel for {{target_audience}}. Warm natural lighting, lifestyle setting. Style: {{visual_style}}.",
  },
  {
    key: "problem_solution",
    label: "Problem/Solution",
    description: "Before/after or problem-solving visual",
    promptTemplate: "Visual showing {{product_name}} by {{brand_name}} as the clear solution. {{industry}} context, compelling transformation or benefit reveal. Designed for {{target_audience}}. Style: {{visual_style}}. Tone: {{brand_tone}}.",
  },
  {
    key: "lifestyle_benefit",
    label: "Lifestyle",
    description: "Aspirational lifestyle scene with product",
    promptTemplate: "Aspirational lifestyle scene featuring {{product_name}} by {{brand_name}} in a {{lifestyle_theme}} setting. Shows the benefit and elevated lifestyle for {{target_audience}}. Natural lighting, editorial quality. Colors: {{brand_colors}}. Style: {{visual_style}}.",
  },
  {
    key: "offer_urgency",
    label: "Offer/Urgency",
    description: "Promotional offer or urgency-driven creative",
    promptTemplate: "Eye-catching promotional creative for {{product_name}} by {{brand_name}}. {{offer_type}} promotion style, bold and attention-grabbing for {{target_audience}}. High contrast, dynamic composition. Colors: {{brand_colors}}. Tone: {{brand_tone}}.",
  },
];
// ── Auto-mix distribution ──
// Maps quantity to how many of each angle to generate
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
 * Uses predefined distributions for known quantities,
 * otherwise interpolates from ratios.
 */
export function getAngleDistribution(
  quantity: number,
  selectedAngles?: AngleKey[],
  lockToSelected?: boolean
): AngleKey[] {
  let angles: AngleKey[];

  if (selectedAngles && selectedAngles.length > 0 && lockToSelected) {
    // Lock mode: only use selected angles, distribute evenly
    angles = [];
    const perAngle = Math.floor(quantity / selectedAngles.length);
    const remainder = quantity % selectedAngles.length;
    for (let i = 0; i < selectedAngles.length; i++) {
      const count = perAngle + (i < remainder ? 1 : 0);
      for (let j = 0; j < count; j++) angles.push(selectedAngles[i]);
    }
  } else if (selectedAngles && selectedAngles.length > 0) {
    // Bias mode: favor selected angles but include others
    const allAngles: AngleKey[] = ["product_hero", "ugc_testimonial", "problem_solution", "lifestyle_benefit", "offer_urgency"];
    const biasedRatios: Record<AngleKey, number> = { ...DEFAULT_RATIOS };
    // Boost selected by 1.5x, reduce others
    const selectedSet = new Set(selectedAngles);
    for (const key of allAngles) {
      if (selectedSet.has(key)) biasedRatios[key] *= 1.5;
      else biasedRatios[key] *= 0.5;
    }
    // Normalize
    const total = Object.values(biasedRatios).reduce((a, b) => a + b, 0);
    angles = [];
    let remaining = quantity;
    const sorted = allAngles.sort((a, b) => biasedRatios[b] - biasedRatios[a]);
    for (let i = 0; i < sorted.length; i++) {
      const count = i === sorted.length - 1 ? remaining : Math.round((biasedRatios[sorted[i]] / total) * quantity);
      for (let j = 0; j < Math.min(count, remaining); j++) angles.push(sorted[i]);
      remaining -= Math.min(count, remaining);
    }
  } else {
    // Auto-mix mode: use predefined or interpolate
    const predefined = AUTOMIX_DISTRIBUTIONS[quantity];
    if (predefined) {
      angles = [];
      for (const [key, count] of Object.entries(predefined)) {
        for (let i = 0; i < count; i++) angles.push(key as AngleKey);
      }
    } else {
      // Interpolate from ratios
      const allAngles: AngleKey[] = ["product_hero", "ugc_testimonial", "problem_solution", "lifestyle_benefit", "offer_urgency"];
      angles = [];
      let remaining = quantity;
      for (let i = 0; i < allAngles.length; i++) {
        const count = i === allAngles.length - 1 ? remaining : Math.round(DEFAULT_RATIOS[allAngles[i]] * quantity);
        for (let j = 0; j < Math.min(count, remaining); j++) angles.push(allAngles[i]);
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
 * Missing fields get safe fallbacks.
 */
function interpolate(template: string, brain: ClientBrain): string {
  const defaults: Record<string, string> = {
    brand_name: "the brand",
    product_name: "the product",
    target_audience: "modern consumers",
    brand_tone: "professional and engaging",
    brand_colors: "brand colors",
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
 */
export function composePrompt(
  angleKey: AngleKey,
  brain: ClientBrain,
  campaignContext?: string
): PromptEngineResult {
  const template = ANGLE_TEMPLATES.find((t) => t.key === angleKey);
  if (!template) {
    // Fallback: use product_hero if angle not found
    return composePrompt("product_hero", brain, campaignContext);
  }

  const anglePrompt = interpolate(template.promptTemplate, brain);
  const parts = [BASE_AD_QUALITY, anglePrompt];
  if (campaignContext && campaignContext.trim().length > 0) {
    parts.push("Campaign context: " + campaignContext.trim());
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
 * Feature flag: set AD_PROMPT_ENGINE_ENABLED=false in env to disable.
 */
export function isPromptEngineEnabled(): boolean {
  const flag = process.env.AD_PROMPT_ENGINE_ENABLED;
  // Default to true; only disable if explicitly set to "false"
  return flag !== "false";
}

/**
 * Build client brain from brand context and profile data.
 * Extracts known fields with safe fallbacks.
 */
export function buildClientBrain(brandContext: Record<string, unknown> | null, profile?: Record<string, unknown> | null): ClientBrain {
  if (!brandContext) return {};
  return {
    brand_name: String(brandContext.brand_name || brandContext.name || ""),
    product_name: String(brandContext.product_name || brandContext.product || ""),
    target_audience: String(brandContext.target_audience || brandContext.audience || ""),
    brand_tone: String(brandContext.brand_tone || brandContext.tone || ""),
    brand_colors: String(brandContext.brand_colors || brandContext.colors || ""),
    visual_style: String(brandContext.visual_style || brandContext.style || profile?.visual_style || ""),
    industry: String(brandContext.industry || ""),
    offer_type: String(brandContext.offer_type || "limited-time"),
    persona_type: String(brandContext.persona_type || "everyday person"),
    lifestyle_theme: String(brandContext.lifestyle_theme || "modern aspirational"),
    avoid_rules: String(brandContext.avoid_rules || brandContext.negative_keywords || ""),
  };
}
