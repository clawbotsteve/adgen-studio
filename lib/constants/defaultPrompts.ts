/**
 * Default curated ad prompts — 5 per category, 20 total.
 * These are used as the baseline prompts for Smart Batch when
 * no client-specific generated prompts exist.
 *
 * Categories: us_vs_them, key_feature, testimonial_review, bundle_offer
 */

export interface DefaultPrompt {
  angle: string;
  label: string;
  prompt_text: string;
}

export const DEFAULT_PROMPTS: DefaultPrompt[] = [
  // ── US VS THEM (5) ──────────────────────────────────────
  {
    angle: "us_vs_them",
    label: "Premium Comparison Hero",
    prompt_text:
      'Photorealistic side-by-side comparison ad, left panel labeled "Others" with cluttered, generic low-quality product presentation, right panel labeled "Us" with clean premium product hero, sharp texture detail, strong contrast, minimal background, conversion-focused social ad layout with clear CTA space, no watermark.',
  },
  {
    angle: "us_vs_them",
    label: "Before After Split",
    prompt_text:
      'Photorealistic split-scene ecommerce ad showing "Before: Them" (messy, frustrating experience) vs "After: Us" (clean, easy, premium result), realistic lighting and material details, mobile-first composition, negative space for headline and offer, no embedded text artifacts.',
  },
  {
    angle: "us_vs_them",
    label: "Two Column Quality",
    prompt_text:
      "Photorealistic comparison campaign visual with two columns: generic competitor look on left (dull, weak styling) and premium brand look on right (crisp product focus, polished composition), realistic shadows, clean commercial lighting, social ad ready.",
  },
  {
    angle: "us_vs_them",
    label: "Durability Face-Off",
    prompt_text:
      'Photorealistic ad creative featuring product quality comparison: left side "Them" appears worn and poorly finished, right side "Us" appears durable and premium with high-detail textures, minimalist background, high-converting DTC style, clear CTA placement.',
  },
  {
    angle: "us_vs_them",
    label: "Bold Visual Contrast",
    prompt_text:
      "Photorealistic modern comparison ad with bold visual contrast between standard option and premium brand option, realistic environment and materials, product-first framing, conversion hierarchy (headline zone, proof zone, CTA zone), no logo distortion.",
  },

  // ── KEY FEATURE (5) ─────────────────────────────────────
  {
    angle: "key_feature",
    label: "Triple Feature Hero",
    prompt_text:
      "Photorealistic product hero ad with three feature callout zones (durability, comfort, premium materials), centered product, clean seamless background, studio commercial lighting, realistic textures, minimalist high-end social campaign style.",
  },
  {
    angle: "key_feature",
    label: "Icon Callout Breakdown",
    prompt_text:
      "Photorealistic feature breakdown ad showing product in center with subtle icon callouts around it, clean negative space, soft directional light, premium ecommerce composition, realistic detail and stitching/material fidelity.",
  },
  {
    angle: "key_feature",
    label: "Pedestal Benefits",
    prompt_text:
      "Photorealistic ad creative focused on core benefits, product displayed on matte pedestal, clear visual hierarchy for key features and CTA area, high-clarity lighting, realistic depth and texture, mobile-first layout.",
  },
  {
    angle: "key_feature",
    label: "Lifestyle Feature Detail",
    prompt_text:
      "Photorealistic lifestyle feature ad showing product in real-use context, tasteful close-up detail insets for key specs, balanced composition, clean modern background, conversion-focused social creative style.",
  },
  {
    angle: "key_feature",
    label: "Infographic Highlight",
    prompt_text:
      "Photorealistic premium campaign image highlighting top 3 product features with clean infographic-ready spacing, realistic reflections/shadows, sharp product contours, minimal clutter, ad-ready DTC visual language.",
  },

  // ── TESTIMONIAL / REVIEW (5) ────────────────────────────
  {
    angle: "testimonial_review",
    label: "Happy Customer Scene",
    prompt_text:
      "Photorealistic customer review ad creative featuring happy customer using product in a clean real environment, authentic expression, subtle quote area and 5-star visual zone, trustworthy conversion-focused social ad layout.",
  },
  {
    angle: "testimonial_review",
    label: "Portrait Side-by-Side",
    prompt_text:
      "Photorealistic testimonial campaign visual with product and customer portrait side-by-side, warm natural lighting, realistic skin/material textures, clean space for review quote and reviewer name, premium but relatable style.",
  },
  {
    angle: "testimonial_review",
    label: "UGC Candid Moment",
    prompt_text:
      "Photorealistic UGC-style review ad with candid customer moment, product clearly visible, believable home/lifestyle setting, trust-building composition with rating area and CTA area, mobile-first framing.",
  },
  {
    angle: "testimonial_review",
    label: "Social Proof Portrait",
    prompt_text:
      "Photorealistic social proof ad featuring customer holding product, positive reaction and genuine smile, clean background, subtle verification-style review box space, polished ecommerce conversion style.",
  },
  {
    angle: "testimonial_review",
    label: "Review Trust Layout",
    prompt_text:
      "Photorealistic review-focused static ad with customer portrait, product close-up, and trust cues (stars, short quote area, satisfaction vibe), balanced composition, realistic details, ready for paid social placements.",
  },

  // ── BUNDLE / OFFER (5) ──────────────────────────────────
  {
    angle: "bundle_offer",
    label: "Premium Bundle Hero",
    prompt_text:
      'Photorealistic bundle offer ad with multiple products arranged in premium hero composition, clean studio background, clear value-stack visual hierarchy, dedicated area for "Bundle & Save" headline and CTA button, high-conversion DTC style.',
  },
  {
    angle: "bundle_offer",
    label: "Tabletop Bundle Setup",
    prompt_text:
      "Photorealistic ecommerce bundle campaign showing main product plus bonus items on a modern tabletop setup, realistic shadows and materials, minimal clutter, mobile-first ad layout with offer and urgency zones.",
  },
  {
    angle: "bundle_offer",
    label: "Limited Time Collection",
    prompt_text:
      "Photorealistic limited-time bundle ad creative with neatly grouped product set, premium lighting and texture clarity, clean negative space for discount callout, polished social media conversion aesthetic.",
  },
  {
    angle: "bundle_offer",
    label: "Layered Value Stack",
    prompt_text:
      "Photorealistic bundle value ad with three coordinated products displayed in layered composition, subtle depth, realistic detail, high-end commercial look, clear visual areas for price anchor, savings message, and CTA.",
  },
  {
    angle: "bundle_offer",
    label: "Pedestal Collection",
    prompt_text:
      "Photorealistic promotional bundle hero on minimalist pedestal scene, products arranged by importance, crisp materials and reflections, conversion-first composition with strong offer zone and call-to-action space, social ad ready.",
  },
];

/** Optional negative prompt to append if the image model supports it */
export const DEFAULT_NEGATIVE_PROMPT =
  "cartoon, anime, CGI, plastic look, blurry, low-res, distorted hands, warped logos, extra fingers, text artifacts, watermark";
