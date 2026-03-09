export interface PromptTemplateItem {
  concept: string;
  prompt_text: string;
  tags: string[];
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  icon: string; // SVG path d attribute
  color: string; // CSS color for the icon background
  items: PromptTemplateItem[];
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: "product_photography",
    name: "Product Photography",
    description:
      "Professional product shots including studio, lifestyle, flat lay, and detail close-ups for e-commerce and marketing.",
    icon: "M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z M12 17a5 5 0 100-10 5 5 0 000 10z",
    color: "rgba(99, 102, 241, 0.12)",
    items: [
      {
        concept: "Hero Shot",
        prompt_text:
          "Professional product hero shot on a clean white background with soft studio lighting. Product is centered and fully visible. Subtle shadow beneath for depth. Shot from a slight three-quarter angle to show dimension. Ultra-high resolution, sharp focus on product details.",
        tags: ["studio", "hero", "white-background"],
      },
      {
        concept: "Lifestyle Scene",
        prompt_text:
          "Product placed naturally in a real-world lifestyle setting that reflects its target audience. Warm, inviting lighting with shallow depth of field. The product is the focal point but surrounded by complementary props and environment. Authentic, aspirational feeling.",
        tags: ["lifestyle", "in-context", "aspirational"],
      },
      {
        concept: "Flat Lay",
        prompt_text:
          "Top-down flat lay composition on a textured surface. Product arranged with complementary accessories and props following the rule of thirds. Clean, organized layout with balanced negative space. Even, diffused lighting from above. Modern editorial style.",
        tags: ["flat-lay", "overhead", "editorial"],
      },
      {
        concept: "Close-up Detail",
        prompt_text:
          "Extreme close-up macro shot highlighting the product texture, materials, and craftsmanship details. Shallow depth of field with razor-sharp focus on the key detail area. Professional lighting that reveals surface texture and quality. Premium feel.",
        tags: ["detail", "macro", "texture"],
      },
      {
        concept: "Group Shot",
        prompt_text:
          "Multiple product variants or collection items arranged together in a cohesive group composition. Clean background, consistent lighting across all items. Products arranged by size or color gradient. Shows the full range while maintaining visual harmony.",
        tags: ["group", "collection", "variants"],
      },
      {
        concept: "Unboxing Moment",
        prompt_text:
          "Product being revealed from premium packaging, capturing the unboxing experience. Packaging partially open with product emerging. Warm, inviting lighting. Focus on the moment of discovery. Tissue paper, branded elements visible. Aspirational first-impression moment.",
        tags: ["unboxing", "packaging", "experience"],
      },
    ],
  },
  {
    id: "background_scene",
    name: "Background & Scene",
    description:
      "Versatile background environments from minimalist studios to outdoor settings, perfect for compositing products or subjects.",
    icon: "M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z",
    color: "rgba(16, 185, 129, 0.12)",
    items: [
      {
        concept: "Minimalist Studio",
        prompt_text:
          "Clean, minimal studio backdrop with soft gradient from white to light gray. Professional three-point lighting setup creating gentle shadows. Smooth, seamless background with no visible seams or edges. Perfect for product placement or subject compositing.",
        tags: ["studio", "minimal", "white"],
      },
      {
        concept: "Outdoor Natural",
        prompt_text:
          "Beautiful outdoor natural setting with soft golden hour lighting. Lush greenery, natural textures, and organic elements. Slightly blurred background creating depth. Warm, inviting atmosphere. Suitable for lifestyle product placement.",
        tags: ["outdoor", "nature", "golden-hour"],
      },
      {
        concept: "Urban Street",
        prompt_text:
          "Modern urban street scene with architectural elements, clean lines, and contemporary feel. Subtle city atmosphere without being busy. Muted tones with pops of color. Blurred pedestrians or traffic in far background. Suitable for fashion or tech products.",
        tags: ["urban", "street", "modern"],
      },
      {
        concept: "Seasonal Holiday",
        prompt_text:
          "Festive holiday-themed background with seasonal decorations, warm lighting, and cozy atmosphere. Rich colors, bokeh lights, and textured surfaces. Evokes celebration and gift-giving. Versatile for product placement during holiday campaigns.",
        tags: ["seasonal", "holiday", "festive"],
      },
      {
        concept: "Gradient Abstract",
        prompt_text:
          "Smooth, modern gradient background blending two complementary colors. Subtle noise texture for visual interest. Clean and contemporary feel perfect for tech, beauty, or premium products. No distracting elements, pure color transition.",
        tags: ["gradient", "abstract", "modern"],
      },
      {
        concept: "Workspace Desk",
        prompt_text:
          "Styled workspace or desk setup viewed from above at a slight angle. Clean desk surface with minimal props like a notebook, pen, plant, and coffee. Organized, productive atmosphere. Natural window light from the side. Perfect for SaaS or productivity products.",
        tags: ["workspace", "desk", "productivity"],
      },
    ],
  },
  {
    id: "ugc_style",
    name: "UGC Style",
    description:
      "Authentic user-generated content looks including selfie reviews, unboxings, tutorials, and testimonials that feel real and relatable.",
    icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75",
    color: "rgba(236, 72, 153, 0.12)",
    items: [
      {
        concept: "Selfie Review",
        prompt_text:
          "Person holding the product up next to their face in a casual selfie-style photo. Natural lighting, slightly imperfect framing. Genuine, happy expression. Background is a real home or casual setting. Phone-quality feel, authentic and unpolished. The product is clearly visible.",
        tags: ["selfie", "review", "authentic"],
      },
      {
        concept: "Unboxing Reaction",
        prompt_text:
          "Genuine reaction shot of someone opening and discovering the product for the first time. Hands visible, packaging partially opened. Expression of surprise and delight. Shot from slightly above, looking down at the unboxing. Natural home setting, warm lighting.",
        tags: ["unboxing", "reaction", "genuine"],
      },
      {
        concept: "Before & After",
        prompt_text:
          "Split or side-by-side comparison showing the transformation or improvement from using the product. Clear, visible difference between the two states. Authentic lighting consistent in both frames. Text overlay areas for labels. Relatable and believable results.",
        tags: ["before-after", "transformation", "comparison"],
      },
      {
        concept: "Day in the Life",
        prompt_text:
          "Candid moment of someone naturally using the product as part of their daily routine. Casual, everyday setting. The product integrates seamlessly into the scene. Warm, natural lighting. Feels like a snapshot from real life, not a staged photo.",
        tags: ["daily-use", "candid", "lifestyle"],
      },
      {
        concept: "Tutorial Clip",
        prompt_text:
          "Person demonstrating how to use the product, hands clearly visible showing the action. Clean, well-lit setting from a slightly overhead angle. Step-by-step demonstration feel. Product packaging visible nearby. Instructional but casual and approachable.",
        tags: ["tutorial", "how-to", "demonstration"],
      },
      {
        concept: "Testimonial",
        prompt_text:
          "Person looking directly at camera giving a personal testimonial about the product. Warm, friendly expression. Casual setting like a living room or kitchen. Natural lighting. The product is visible but secondary to the person. Authentic, trustworthy feel.",
        tags: ["testimonial", "talking-head", "trust"],
      },
    ],
  },
  {
    id: "fashion_apparel",
    name: "Fashion & Apparel",
    description:
      "Fashion-focused shots from on-model styling to flat lays and detail textures, perfect for clothing and accessory brands.",
    icon: "M20.38 3.46L16 2 12 5.5 8 2l-4.38 1.46a.5.5 0 00-.32.47L3 18.5C3 19.88 5.46 21 8.5 21c1.59 0 3.05-.36 4.15-.96L12 20.5l-.65-.46C12.45 20.64 13.91 21 15.5 21c3.04 0 5.5-1.12 5.5-2.5L20.7 3.93a.5.5 0 00-.32-.47z",
    color: "rgba(168, 85, 247, 0.12)",
    items: [
      {
        concept: "On-Model Front",
        prompt_text:
          "Full-length front-facing model shot wearing the garment. Clean, neutral background. Professional fashion lighting highlighting the silhouette and fabric. Model in a natural, confident pose. Garment is styled and fitted properly. High-resolution showing fabric texture.",
        tags: ["on-model", "front", "full-length"],
      },
      {
        concept: "Styling Flat Lay",
        prompt_text:
          "Curated flat lay of the garment with complementary accessories, shoes, and styling props. Shot from directly above on a clean surface. Items arranged with intentional spacing and composition. Creates a complete outfit story. Editorial, aspirational styling.",
        tags: ["flat-lay", "styling", "outfit"],
      },
      {
        concept: "Detail Texture",
        prompt_text:
          "Extreme close-up of the fabric texture, stitching, buttons, or hardware details. Shot with macro lens showing the quality of materials and construction. Soft, directional lighting revealing the surface character. Conveys premium quality and craftsmanship.",
        tags: ["detail", "texture", "quality"],
      },
      {
        concept: "Outfit Grid",
        prompt_text:
          "Grid layout of multiple outfit combinations or pieces from the collection. Each item neatly folded or laid flat in its own cell. Consistent lighting and spacing. Shows versatility and range. Clean, organized presentation perfect for social media.",
        tags: ["grid", "collection", "versatile"],
      },
      {
        concept: "Street Style",
        prompt_text:
          "Model wearing the garment in an urban street setting, captured in a candid street-style photography look. Motion blur or dynamic pose. City environment in the background. Natural daylight. Fashion-forward, editorial feel that's also relatable and aspirational.",
        tags: ["street-style", "urban", "editorial"],
      },
      {
        concept: "Lookbook",
        prompt_text:
          "Editorial lookbook-style shot with the model in a curated setting that tells a story. Intentional color palette and mood. Multiple pieces styled together. Professional fashion photography with artistic direction. Evokes a specific lifestyle or season.",
        tags: ["lookbook", "editorial", "story"],
      },
    ],
  },
  {
    id: "food_beverage",
    name: "Food & Beverage",
    description:
      "Appetizing food and drink photography from overhead flat lays to action pour shots and styled compositions.",
    icon: "M18 8h1a4 4 0 010 8h-1 M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z M6 1v3 M10 1v3 M14 1v3",
    color: "rgba(245, 158, 11, 0.12)",
    items: [
      {
        concept: "Overhead Flat Lay",
        prompt_text:
          "Bird's eye view of food or beverage arranged on a styled surface with complementary ingredients, utensils, and garnishes. Balanced composition following visual guidelines. Even, soft lighting from above. Rich colors and appetizing textures. Instagram-worthy presentation.",
        tags: ["overhead", "flat-lay", "styled"],
      },
      {
        concept: "Side Profile",
        prompt_text:
          "Eye-level side shot of the food or beverage showing layers, height, and dimension. Shallow depth of field with the front in sharp focus. Professional food styling with visible textures and drips. Moody, warm lighting from the side. Restaurant-quality presentation.",
        tags: ["side-view", "profile", "dimension"],
      },
      {
        concept: "Ingredients Spread",
        prompt_text:
          "Artful arrangement of raw ingredients that make up the product or recipe. Spread across a textured surface like marble or wood. Each ingredient clearly identifiable and beautifully presented. Natural, fresh appearance. Tells the story of what goes into the product.",
        tags: ["ingredients", "raw", "fresh"],
      },
      {
        concept: "Lifestyle Setting",
        prompt_text:
          "Food or beverage being enjoyed in a real lifestyle moment — at a table, picnic, gathering, or cafe. People partially visible, focus on the product in context. Warm, inviting atmosphere. Natural lighting. Evokes the experience and emotion of consumption.",
        tags: ["lifestyle", "in-context", "social"],
      },
      {
        concept: "Pour & Action",
        prompt_text:
          "Dynamic action shot capturing movement — a pour, drizzle, splash, or steam rising. Frozen moment with crisp detail. Dramatic lighting highlighting the liquid or movement. Dark or contrasting background to emphasize the action. High-speed photography feel.",
        tags: ["action", "pour", "dynamic"],
      },
      {
        concept: "Packaging Focus",
        prompt_text:
          "Product packaging as the hero, styled with relevant food props and ingredients around it. Clean but appetizing composition. Label and branding clearly readable. Professional product photography meets food styling. Shows what the customer receives.",
        tags: ["packaging", "branding", "product"],
      },
    ],
  },
];
