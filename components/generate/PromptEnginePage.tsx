"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PromptTemplate {
  id: string;
  title: string;
  prompt: string;
  preview: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  prompts: PromptTemplate[];
}

const CATEGORIES: Category[] = [
  {
    id: "product-spotlight",
    name: "Product Spotlight",
    icon: "\u2728",
    description: "Hero shots that put your product front and center",
    color: "#6382ff",
    prompts: [
      {
        id: "ps-1",
        title: "Studio Hero Shot",
        preview: "Clean, professional product photography",
        prompt: "Professional studio product photography on a clean minimal background with dramatic directional lighting, subtle shadows, and a sharp focus on the product details. High-end commercial look with a sleek modern aesthetic."
      },
      {
        id: "ps-2",
        title: "Detail Close-Up",
        preview: "Macro detail highlighting craftsmanship",
        prompt: "Extreme close-up detail shot highlighting the premium texture, materials, and craftsmanship of the product. Soft bokeh background, warm studio lighting, and a luxurious feel that communicates quality."
      },
      {
        id: "ps-3",
        title: "Flat Lay Arrangement",
        preview: "Styled overhead layout with accessories",
        prompt: "Stylish flat lay arrangement photographed from directly above on a clean marble or concrete surface. Product centered with complementary accessories and props arranged artfully around it. Soft natural light, editorial style."
      },
      {
        id: "ps-4",
        title: "Floating Product",
        preview: "Dynamic floating shot with gradient background",
        prompt: "Dynamic floating product shot suspended in mid-air against a smooth gradient background. Dramatic lighting with subtle reflections and shadows below. Bold, modern, and eye-catching commercial style perfect for digital ads."
      },
    ],
  },
  {
    id: "lifestyle-scene",
    name: "Lifestyle & Scene",
    icon: "\u{1F3DE}",
    description: "Product in real-world, aspirational settings",
    color: "#22c55e",
    prompts: [
      {
        id: "ls-1",
        title: "Golden Hour Moment",
        preview: "Warm outdoor setting during magic hour",
        prompt: "Lifestyle photograph of someone naturally using the product outdoors during golden hour. Warm sun flare, soft shadows, candid and authentic feel. Urban street or park setting with a modern aspirational vibe."
      },
      {
        id: "ls-2",
        title: "Cozy Home Setting",
        preview: "Warm, inviting home environment",
        prompt: "Product beautifully styled in a cozy, well-designed home interior. Warm ambient lighting, soft textures like linen and wood. The scene feels inviting, comfortable, and aspirational — like a lifestyle magazine spread."
      },
      {
        id: "ls-3",
        title: "Active & Outdoors",
        preview: "Adventure and action in nature",
        prompt: "Action-oriented lifestyle shot featuring the product in an exciting outdoor adventure setting — mountains, beach, or trail. Dynamic movement, vibrant natural colors, and energetic composition that conveys an active lifestyle."
      },
      {
        id: "ls-4",
        title: "Urban Premium",
        preview: "Upscale city environment",
        prompt: "Sophisticated urban lifestyle scene with the product featured in a premium city environment — upscale cafe, boutique hotel lobby, or rooftop terrace. Elegant, polished, and aspirational with a fashion-forward aesthetic."
      },
    ],
  },  {
    id: "promo-sale",
    name: "Promotional & Sale",
    icon: "\u{1F525}",
    description: "Urgency-driven offers, drops, and campaigns",
    color: "#ef4444",
    prompts: [
      {
        id: "pr-1",
        title: "Flash Sale Banner",
        preview: "Bold, high-energy sale announcement",
        prompt: "High-energy promotional banner creative with bold SALE typography, vibrant contrasting colors, and the product as the centerpiece. Dynamic diagonal lines, starburst effects, and a strong call-to-action. Designed to stop the scroll."
      },
      {
        id: "pr-2",
        title: "Limited Drop",
        preview: "Exclusive, premium limited edition reveal",
        prompt: "Premium limited edition product drop announcement. Dark luxurious background with gold or metallic accents. Product displayed with exclusive packaging. Text overlay reads LIMITED DROP with urgency-driven design elements."
      },
      {
        id: "pr-3",
        title: "Seasonal Campaign",
        preview: "Festive, seasonal promotional creative",
        prompt: "Seasonal promotional creative with festive themed elements matching the current season. Product integrated naturally with seasonal decorations and colors. Warm, inviting composition with a prominent offer callout and clear CTA button."
      },
      {
        id: "pr-4",
        title: "Bundle Deal",
        preview: "Multi-product value pack offer",
        prompt: "Eye-catching bundle deal creative showing multiple products arranged together as a value package. Clean layout with clear pricing comparison, savings callout, and a modern gradient background. Professional e-commerce style."
      },
    ],
  },
  {
    id: "before-after",
    name: "Before & After",
    icon: "\u{1F504}",
    description: "Transformation and result-driven creatives",
    color: "#f59e0b",
    prompts: [
      {
        id: "ba-1",
        title: "Side-by-Side Split",
        preview: "Classic before/after comparison",
        prompt: "Clean side-by-side split-screen comparison creative. Left side shows the BEFORE state in muted, desaturated tones. Right side shows the vibrant, enhanced AFTER result. Sharp dividing line down the center with clear before/after labels."
      },
      {
        id: "ba-2",
        title: "Dramatic Reveal",
        preview: "Unveiling transformation moment",
        prompt: "Dramatic reveal-style creative showing a transformation moment. The product is positioned as the catalyst of change. Use a swipe or peel-back effect suggesting the before state being revealed to show the stunning after result underneath."
      },
      {
        id: "ba-3",
        title: "Progress Timeline",
        preview: "Step-by-step improvement journey",
        prompt: "Progress timeline creative showing 3-4 stages of gradual improvement from using the product. Arranged left to right with subtle arrows connecting each stage. Clean, clinical presentation that builds credibility through visible progression."
      },
      {
        id: "ba-4",
        title: "Contrast Impact",
        preview: "Stark contrast highlighting results",
        prompt: "High-impact contrast creative with a stark visual difference between the problem state and the solution. Split diagonally with one half showing the struggle in dark moody tones and the other showing the bright confident result. Bold and attention-grabbing."
      },
    ],
  },  {
    id: "brand-story",
    name: "Brand Story",
    icon: "\u{1F4D6}",
    description: "Emotional, narrative-driven brand creatives",
    color: "#a855f7",
    prompts: [
      {
        id: "bs-1",
        title: "Behind the Craft",
        preview: "Artisanal creation process",
        prompt: "Behind-the-scenes craft narrative showing the artisanal creation process of the product. Hands working with raw materials, workshop environment, warm documentary-style lighting. Communicates care, quality, and authenticity."
      },
      {
        id: "bs-2",
        title: "Founder's Vision",
        preview: "Origin story and brand mission",
        prompt: "Founder's vision narrative creative set in an authentic, raw environment such as a workshop, studio, or meaningful location. Product placed alongside tools of the trade. Moody cinematic lighting with a storytelling composition that communicates passion and purpose."
      },
      {
        id: "bs-3",
        title: "Heritage & Roots",
        preview: "Tradition and brand legacy",
        prompt: "Heritage-inspired creative connecting the product to its cultural roots and brand legacy. Vintage textures, timeless typography, and warm earthy tones. The composition bridges past and present, showing tradition meeting modern innovation."
      },
      {
        id: "bs-4",
        title: "Community & Culture",
        preview: "People and shared experiences",
        prompt: "Community-driven creative showing diverse people coming together around the product. Candid group moments, genuine smiles, shared experiences. Warm inclusive atmosphere that communicates belonging, connection, and shared values."
      },
    ],
  },
  {
    id: "ugc-social-proof",
    name: "UGC & Social Proof",
    icon: "\u{1F4F1}",
    description: "Authentic, trust-building customer content",
    color: "#06b6d4",
    prompts: [
      {
        id: "ugc-1",
        title: "Unboxing Experience",
        preview: "First impressions and reveal moment",
        prompt: "Authentic unboxing-style creative showing the product being revealed from its packaging for the first time. Overhead angle, natural home lighting, genuine excitement. Tissue paper, branded box details, and a first-impression feel that is relatable and real."
      },
      {
        id: "ugc-2",
        title: "Customer Testimonial",
        preview: "Real review with star rating overlay",
        prompt: "Customer testimonial creative with a candid natural photo style. Product shown in an everyday real-life setting. Clean text overlay with a 5-star rating, short punchy customer quote, and verified buyer badge. Authentic and trustworthy."
      },
      {
        id: "ugc-3",
        title: "Social Repost Style",
        preview: "Instagram/TikTok native content feel",
        prompt: "Social media native content-style creative that looks like an organic Instagram or TikTok post. Casual authentic photography of the product in everyday use. Slight phone-camera aesthetic with natural lighting. Feels genuine, not overly produced."
      },
      {
        id: "ugc-4",
        title: "Review Roundup",
        preview: "Compilation of top customer feedback",
        prompt: "Review roundup creative compiling the top 3 customer testimonials in a clean modern card layout. Each review shows a star rating, short quote, and customer name. Product image centered with social proof surrounding it. Professional yet authentic."
      },
    ],
  },
];
export default function PromptEnginePage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const selectedCategory = CATEGORIES.find((c) => c.id === activeCategory);

  const handleUsePrompt = (prompt: string) => {
    // Store prompt in sessionStorage and redirect to generate page
    sessionStorage.setItem("adgen_prompt", prompt);
    router.push("/batch/create");
  };

  const handleCopyPrompt = async (promptText: string, promptId: string) => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopiedId(promptId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  return (
    <div className="prompt-engine">
      <div className="prompt-engine-header">
        <h1>Prompt Engine</h1>
        <p>Select a category to explore pre-built prompts optimized for ad creative generation</p>
      </div>

      <div className="prompt-engine-categories">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`prompt-category-card ${activeCategory === cat.id ? "active" : ""}`}
            onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
            style={{ "--cat-color": cat.color } as React.CSSProperties}
          >
            <div className="prompt-category-icon">{cat.icon}</div>
            <div className="prompt-category-info">
              <h3>{cat.name}</h3>
              <p>{cat.description}</p>
            </div>
            <div className="prompt-category-count">{cat.prompts.length} prompts</div>
          </button>
        ))}
      </div>

      {selectedCategory && (
        <div className="prompt-templates-section">
          <div className="prompt-templates-header">
            <h2 style={{ color: selectedCategory.color }}>
              {selectedCategory.icon} {selectedCategory.name}
            </h2>
            <span className="prompt-templates-subtitle">Click a prompt to use it in the generator</span>
          </div>
          <div className="prompt-templates-grid">
            {selectedCategory.prompts.map((pt) => (
              <div key={pt.id} className="prompt-template-card">
                <div className="prompt-template-top">
                  <h4>{pt.title}</h4>
                  <span className="prompt-template-preview">{pt.preview}</span>
                </div>
                <div className="prompt-template-body">
                  <p className="prompt-template-text">{pt.prompt}</p>
                </div>
                <div className="prompt-template-actions">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleUsePrompt(pt.prompt)}
                  >
                    Use Prompt
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleCopyPrompt(pt.prompt, pt.id)}
                  >
                    {copiedId === pt.id ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}