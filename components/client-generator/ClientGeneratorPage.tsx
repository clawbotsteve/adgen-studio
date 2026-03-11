"use client";

import { useState, useCallback } from "react";
import {
  Fingerprint,
  Mic,
  ShoppingBag,
  Crosshair,
  Users,
  BookOpen,
  CalendarDays,
  ShieldCheck,
  FlaskConical,
  Paintbrush,
  SlidersHorizontal,
  MonitorSmartphone,
  Target,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  ChevronRight,
  Save,
} from "lucide-react";

/* ── Section / sub-item definitions ──────────────────────────── */

interface SubItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}
interface Section {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  items: SubItem[];
}

const SECTIONS: Section[] = [
  {
    id: "brand-dna",
    number: 1,
    title: "Brand DNA",
    subtitle: "Identity & Core Values",
    items: [
      { id: "voice", label: "Brand Voice & Guidelines", icon: <Mic size={15} /> },
      { id: "products", label: "Products & USP", icon: <ShoppingBag size={15} /> },
      { id: "competitors", label: "Competitive Landscape", icon: <Crosshair size={15} /> },
      { id: "personas", label: "Customer Personas", icon: <Users size={15} /> },
      { id: "founder", label: "Founder Story", icon: <BookOpen size={15} /> },
    ],
  },
  {
    id: "strategy",
    number: 2,
    title: "Strategy",
    subtitle: "Market Position & Testing",
    items: [
      { id: "calendar", label: "Marketing Calendar", icon: <CalendarDays size={15} /> },
      { id: "compliance", label: "Compliance & Legal", icon: <ShieldCheck size={15} /> },
      { id: "testing", label: "Testing Priorities", icon: <FlaskConical size={15} /> },
      { id: "creative-bg", label: "Creative Background", icon: <Paintbrush size={15} /> },
    ],
  },
  {
    id: "creative-ops",
    number: 3,
    title: "Creative Ops",
    subtitle: "Execution & Logistics",
    items: [
      { id: "constraints", label: "Creative Ops Constraints", icon: <SlidersHorizontal size={15} /> },
      { id: "ad-accounts", label: "Ad Account Details", icon: <MonitorSmartphone size={15} /> },
      { id: "strategy-goals", label: "Creative Strategy Goals", icon: <Target size={15} /> },
      { id: "assets", label: "Brand Assets", icon: <Upload size={15} /> },
    ],
  },
];

const ALL_ITEMS = SECTIONS.flatMap((s) => s.items.map((i) => i.id));

/* ── Reusable form components ────────────────────────────────── */

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="cg-field-label">{children}</label>;
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="cg-field-hint">{children}</p>;
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 4,
  warm = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  warm?: boolean;
}) {
  return (
    <textarea
      className={`cg-textarea${warm ? " cg-textarea-warm" : ""}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
    />
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  small = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  small?: boolean;
}) {
  return (
    <input
      type="text"
      className={`cg-input${small ? " cg-input-sm" : ""}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

/* ── Form data types ─────────────────────────────────────────── */

interface Competitor {
  website: string;
  notes: string;
}

interface FormData {
  /* Brand DNA */
  toneOfVoice: string;
  brandPersonality: string;
  voiceMoreOf: string;
  voiceLessOf: string;
  productDescription: string;
  usp: string;
  differentiators: string;
  competitors: Competitor[];
  targetAudience: string;
  demographics: string;
  painPoints: string;
  founderStory: string;
  mission: string;
  /* Strategy */
  keyDates: string;
  seasonalCampaigns: string;
  regulations: string;
  disclaimers: string;
  restrictedClaims: string;
  testingHypotheses: string;
  kpis: string;
  pastCampaigns: string;
  stylePreferences: string;
  /* Creative Ops */
  budgetRange: string;
  turnaround: string;
  approvalWorkflow: string;
  platforms: string;
  pixelIds: string;
  spendTargets: string;
  campaignObjectives: string;
  funnelStages: string;
  ctaPreferences: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontPrimary: string;
  fontSecondary: string;
}

const INITIAL_DATA: FormData = {
  toneOfVoice: "",
  brandPersonality: "",
  voiceMoreOf: "",
  voiceLessOf: "",
  productDescription: "",
  usp: "",
  differentiators: "",
  competitors: [{ website: "", notes: "" }],
  targetAudience: "",
  demographics: "",
  painPoints: "",
  founderStory: "",
  mission: "",
  keyDates: "",
  seasonalCampaigns: "",
  regulations: "",
  disclaimers: "",
  restrictedClaims: "",
  testingHypotheses: "",
  kpis: "",
  pastCampaigns: "",
  stylePreferences: "",
  budgetRange: "",
  turnaround: "",
  approvalWorkflow: "",
  platforms: "",
  pixelIds: "",
  spendTargets: "",
  campaignObjectives: "",
  funnelStages: "",
  ctaPreferences: "",
  primaryColor: "#7c5cfc",
  secondaryColor: "#1e293b",
  accentColor: "#f59e0b",
  fontPrimary: "",
  fontSecondary: "",
};

/* ── Section content renderers ───────────────────────────────── */

function VoiceSection({ data, set }: { data: FormData; set: (d: Partial<FormData>) => void }) {
  return (
    <div className="cg-section-content">
      <h2 className="cg-section-title"><Mic size={20} /> Brand Voice &amp; Guidelines</h2>

      <div className="cg-field-group">
        <FieldLabel>TONE OF VOICE</FieldLabel>
        <FieldHint>Describe how your brand speaks — formal, casual, witty, authoritative, etc.</FieldHint>
        <TextArea value={data.toneOfVoice} onChange={(v) => set({ toneOfVoice: v })} placeholder="e.g. Friendly and approachable, but knowledgeable. We avoid jargon and speak like a trusted advisor..." rows={4} />
      </div>

      <div className="cg-field-group">
        <FieldLabel>BRAND PERSONALITY</FieldLabel>
        <FieldHint>If your brand were a person, how would you describe them?</FieldHint>
        <TextArea value={data.brandPersonality} onChange={(v) => set({ brandPersonality: v })} placeholder="e.g. A smart, confident friend who simplifies complex topics without being condescending..." rows={3} />
      </div>

      <div className="cg-field-group">
        <FieldLabel>VOICE GUIDELINES</FieldLabel>
        <FieldHint>What should your content lean into vs. avoid?</FieldHint>
        <div className="cg-pair-fields">
          <div className="cg-pair-field">
            <span className="cg-pair-label">MORE OF THIS</span>
            <TextArea value={data.voiceMoreOf} onChange={(v) => set({ voiceMoreOf: v })} placeholder="e.g. Conversational tone, bold claims backed by data, humor..." rows={3} warm />
          </div>
          <div className="cg-pair-field">
            <span className="cg-pair-label">LESS OF THIS</span>
            <TextArea value={data.voiceLessOf} onChange={(v) => set({ voiceLessOf: v })} placeholder="e.g. Corporate speak, passive voice, vague promises..." rows={3} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductsSection({ data, set }: { data: FormData; set: (d: Partial<FormData>) => void }) {
  return (
    <div className="cg-section-content">
      <h2 className="cg-section-title"><ShoppingBag size={20} /> Products &amp; USP</h2>

      <div className="cg-field-group">
        <FieldLabel>PRODUCT / SERVICE DESCRIPTION</FieldLabel>
        <FieldHint>What do you sell? Describe your core offering in plain language.</FieldHint>
        <TextArea value={data.productDescription} onChange={(v) => set({ productDescription: v })} placeholder="e.g. We sell premium wireless earbuds designed for athletes. Sweat-proof, 12-hour battery..." rows={4} />
      </div>

      <div className="cg-field-group">
        <FieldLabel>UNIQUE SELLING PROPOSITION</FieldLabel>
        <FieldHint>What makes you different from everyone else? Why should a customer choose you?</FieldHint>
        <TextArea value={data.usp} onChange={(v) => set({ usp: v })} placeholder="e.g. Only earbuds with real-time heart rate coaching built into the audio..." rows={3} />
      </div>

      <div className="cg-field-group">
        <FieldLabel>KEY DIFFERENTIATORS</FieldLabel>
        <FieldHint>List the specific features, values, or qualities that set you apart.</FieldHint>
        <TextArea value={data.differentiators} onChange={(v) => set({ differentiators: v })} placeholder="e.g. Patent-pending bone conduction, 30-day money-back guarantee, endorsed by 50+ pro athletes..." rows={3} />
      </div>
    </div>
  );
}

function CompetitorsSection({ data, set }: { data: FormData; set: (d: Partial<FormData>) => void }) {
  const addCompetitor = () => set({ competitors: [...data.competitors, { website: "", notes: "" }] });
  const removeCompetitor = (idx: number) => set({ competitors: data.competitors.filter((_, i) => i !== idx) });
  const updateCompetitor = (idx: number, field: keyof Competitor, val: string) => {
    const updated = [...data.competitors];
    updated[idx] = { ...updated[idx], [field]: val };
    set({ competitors: updated });
  };

  return (
    <div className="cg-section-content">
      <h2 className="cg-section-title"><Crosshair size={20} /> Competitive Landscape</h2>
      <FieldHint>We recommend adding at least 3 competitors and their websites so we can study their positioning.</FieldHint>

      {data.competitors.map((comp, idx) => (
        <div key={idx} className="cg-competitor-card">
          <div className="cg-competitor-header">
            <FieldLabel>COMPETITOR WEBSITE #{idx + 1}</FieldLabel>
            {data.competitors.length > 1 && (
              <button className="cg-competitor-remove" onClick={() => removeCompetitor(idx)}>
                <Trash2 size={14} />
              </button>
            )}
          </div>
          <TextInput value={comp.website} onChange={(v) => updateCompetitor(idx, "website", v)} placeholder="https://competitor.com" />
          <div style={{ marginTop: "12px" }}>
            <FieldLabel>WHAT SHOULD WE KNOW ABOUT THEM?</FieldLabel>
            <TextArea value={comp.notes} onChange={(v) => updateCompetitor(idx, "notes", v)} placeholder="e.g. They use cheap plastic, we use aerospace aluminum..." rows={3} warm />
          </div>
        </div>
      ))}

      <button className="cg-add-btn" onClick={addCompetitor} style={{ marginTop: "8px" }}>
        <Plus size={16} /> Add Another Competitor
      </button>
    </div>
  );
}

function PersonasSection({ data, set }: { data: FormData; set: (d: Partial<FormData>) => void }) {
  return (
    <div className="cg-section-content">
      <h2 className="cg-section-title"><Users size={20} /> Customer Personas</h2>

      <div className="cg-field-group">
        <FieldLabel>TARGET AUDIENCE</FieldLabel>
        <FieldHint>Who are your ideal customers? Describe them in detail.</FieldHint>
        <TextArea value={data.targetAudience} onChange={(v) => set({ targetAudience: v })} placeholder="e.g. Health-conscious millennials aged 25-35 who exercise 4+ times per week..." rows={4} />
      </div>

      <div className="cg-field-group">
        <FieldLabel>DEMOGRAPHICS</FieldLabel>
        <FieldHint>Age range, gender, location, income level, education, etc.</FieldHint>
        <TextArea value={data.demographics} onChange={(v) => set({ demographics: v })} placeholder="e.g. 25-40, mostly male, urban US cities, $60-120k household income..." rows={3} />
      </div>

      <div className="cg-field-group">
        <FieldLabel>PAIN POINTS</FieldLabel>
        <FieldHint>What problems keep your customers up at night? What frustrates them about current solutions?</FieldHint>
        <TextArea value={data.painPoints} onChange={(v) => set({ painPoints: v })} placeholder="e.g. Earbuds fall out during workouts, batteries die mid-run, can't hear traffic while running outdoors..." rows={4} />
      </div>
    </div>
  );
}

function FounderSection({ data, set }: { data: FormData; set: (d: Partial<FormData>) => void }) {
  return (
    <div className="cg-section-content">
      <h2 className="cg-section-title"><BookOpen size={20} /> Founder Story</h2>

      <div className="cg-field-group">
        <FieldLabel>ORIGIN STORY</FieldLabel>
        <FieldHint>How did the brand start? What inspired its creation?</FieldHint>
        <TextArea value={data.founderStory} onChange={(v) => set({ founderStory: v })} placeholder="e.g. After my earbuds died mid-marathon for the third time, I quit my engineering job and spent 2 years building..." rows={5} warm />
      </div>

      <div className="cg-field-group">
        <FieldLabel>MISSION & PURPOSE</FieldLabel>
        <FieldHint>Why does your brand exist beyond making money?</FieldHint>
        <TextArea value={data.mission} onChange={(v) => set({ mission: v })} placeholder="e.g. To empower athletes with technology that keeps up with their ambition..." rows={3} />
      </div>
    </div>
  );
}

function CalendarSection({ data, set }: { data: FormData; set: (d: Partial<FormData>) => void }) {
  return (
    <div className="cg-section-content">
      <h2 className="cg-section-title"><CalendarDays size={20} /> Marketing Calendar</h2>

      <div className="cg-field-group">
        <FieldLabel>KEY DATES & LAUNCHES</FieldLabel>
        <FieldHint>Important dates, product launches, or events coming up.</FieldHint>
        <TextArea value={data.keyDates} onChange={(v) => set({ keyDates: v })} placeholder="e.g. Q2 product launch April 15, Summer campaign June 1, Black Friday promo starts Nov 20..." rows={4} />
      </div>

      <div className="cg-field-group">
        <FieldLabel>SEASONAL CAMPAIGNS</FieldLabel>
        <FieldHint>Recurring seasonal themes or campaigns you run every year.</FieldHint>
        <TextArea value={data.seasonalCampaigns} onChange={(v) => set({ seasonalCampaigns: v })} placeholder="e.g. New Year fitness push (Jan), Summer outdoor campaign (June-Aug), Holiday gift guide (Nov-Dec)..." rows={3} />
      </div>
    </div>
  );
}

function ComplianceSection({ data, set }: { data: FormData; set: (d: Partial<FormData>) => void }) {
  return (
    <div className="cg-section-content">
      <h2 className="cg-section-title"><ShieldCheck size={20} /> Compliance &amp; Legal</h2>

      <div className="cg-field-group">
        <FieldLabel>INDUSTRY REGULATIONS</FieldLabel>
        <FieldHint>Any industry-specific regulations or advertising standards you must follow?</FieldHint>
        <TextArea value={data.regulations} onChange={(v) => set({ regulations: v })} placeholder="e.g. FDA guidelines for health claims, FTC endorsement rules, HIPAA considerations..." rows={3} />
      </div>

      <div className="cg-field-group">
        <FieldLabel>REQUIRED DISCLAIMERS</FieldLabel>
        <FieldHint>Any disclaimers that must appear in your ads or content?</FieldHint>
        <TextArea value={data.disclaimers} onChange={(v) => set({ disclaimers: v })} placeholder='e.g. "Results may vary", "Not intended to diagnose or treat any condition"...' rows={3} />
      </div>

      <div className="cg-field-group">
        <FieldLabel>RESTRICTED CLAIMS</FieldLabel>
        <FieldHint>Things you absolutely cannot say or imply in marketing.</FieldHint>
        <TextArea value={data.restrictedClaims} onChange={(v) => set({ restrictedClaims: v })} placeholder='e.g. Cannot claim "FDA approved", cannot guarantee specific weight loss numbers...' rows={3} />
      </div>
    </div>
  );
}

function TestingSection({ data, set }: { data: FormData; set: (d: Partial<FormData>) => void }) {
  return (
    <div className="cg-section-content">
      <h2 className="cg-section-title"><FlaskConical size={20} /> Testing Priorities</h2>

      <div className="cg-field-group">
        <FieldLabel>TESTING HYPOTHESES</FieldLabel>
        <FieldHint>What do you want to A/B test? What assumptions should we validate?</FieldHint>
        <TextArea value={data.testingHypotheses} onChange={(v) => set({ testingHypotheses: v })} placeholder="e.g. UGC-style ads outperform polished studio ads for cold traffic. Humor hooks convert better than pain-point hooks..." rows={4} />
      </div>

      <div className="cg-field-group">
        <FieldLabel>KEY PERFORMANCE INDICATORS</FieldLabel>
        <FieldHint>Which metrics matter most to you?</FieldHint>
        <TextArea value={data.kpis} onChange={(v) => set({ kpis: v })} placeholder="e.g. ROAS > 3x, CPA under $25, CTR above 2%, thumb-stop rate > 30%..." rows={3} />
      </div>
    </div>
  );
}

function CreativeBgSection({ data, set }: { data: FormData; set: (d: Partial<FormData>) => void }) {
  return (
    <div className="cg-section-content">
      <h2 className="cg-section-title"><Paintbrush size={20} /> Creative Background</h2>

      <div className="cg-field-group">
        <FieldLabel>PAST CAMPAIGNS</FieldLabel>
        <FieldHint>What has worked well in the past? What flopped? Include links if possible.</FieldHint>
        <TextArea value={data.pastCampaigns} onChange={(v) => set({ pastCampaigns: v })} placeholder="e.g. Our 'Built for Beasts' campaign on Meta did 4.2x ROAS. The lifestyle photo ads underperformed vs. UGC..." rows={4} warm />
      </div>

      <div className="cg-field-group">
        <FieldLabel>STYLE PREFERENCES</FieldLabel>
        <FieldHint>What visual or creative style resonates with your audience?</FieldHint>
        <TextArea value={data.stylePreferences} onChange={(v) => set({ stylePreferences: v })} placeholder="e.g. Bold, high-contrast imagery. Dark backgrounds. Action shots preferred over product-only photos..." rows={3} />
      </div>
    </div>
  );
}

function ConstraintsSection({ data, set }: { data: FormData; set: (d: Partial<FormData>) => void }) {
  return (
    <div className="cg-section-content">
      <h2 className="cg-section-title"><SlidersHorizontal size={20} /> Creative Ops Constraints</h2>

      <div className="cg-field-group">
        <FieldLabel>BUDGET RANGE</FieldLabel>
        <FieldHint>What is your monthly creative budget?</FieldHint>
        <TextInput value={data.budgetRange} onChange={(v) => set({ budgetRange: v })} placeholder="e.g. $5,000 - $15,000/month" />
      </div>

      <div className="cg-field-group">
        <FieldLabel>TURNAROUND EXPECTATIONS</FieldLabel>
        <FieldHint>How quickly do you need creative assets delivered?</FieldHint>
        <TextArea value={data.turnaround} onChange={(v) => set({ turnaround: v })} placeholder="e.g. 48-hour turnaround for static ads, 1 week for video. Rush requests need 24-hour notice..." rows={3} />
      </div>

      <div className="cg-field-group">
        <FieldLabel>APPROVAL WORKFLOW</FieldLabel>
        <FieldHint>Who needs to sign off on creative before it goes live?</FieldHint>
        <TextArea value={data.approvalWorkflow} onChange={(v) => set({ approvalWorkflow: v })} placeholder="e.g. Creative Director reviews first, then Brand Manager gives final approval. Legal review needed for health claims..." rows={3} />
      </div>
    </div>
  );
}

function AdAccountsSection({ data, set }: { data: FormData; set: (d: Partial<FormData>) => void }) {
  return (
    <div className="cg-section-content">
      <h2 className="cg-section-title"><MonitorSmartphone size={20} /> Ad Account Details</h2>

      <div className="cg-field-group">
        <FieldLabel>PLATFORMS</FieldLabel>
        <FieldHint>Which advertising platforms are you active on?</FieldHint>
        <TextArea value={data.platforms} onChange={(v) => set({ platforms: v })} placeholder="e.g. Meta (Facebook + Instagram), Google Ads, TikTok Ads, YouTube..." rows={3} />
      </div>

      <div className="cg-field-group">
        <FieldLabel>PIXEL / TRACKING IDS</FieldLabel>
        <FieldHint>Any tracking pixel IDs or account identifiers we should know about.</FieldHint>
        <TextArea value={data.pixelIds} onChange={(v) => set({ pixelIds: v })} placeholder="e.g. Meta Pixel: 123456789, TikTok Pixel: ABCDEF123..." rows={2} />
      </div>

      <div className="cg-field-group">
        <FieldLabel>SPEND TARGETS</FieldLabel>
        <FieldHint>Monthly ad spend per platform or overall budget allocation.</FieldHint>
        <TextArea value={data.spendTargets} onChange={(v) => set({ spendTargets: v })} placeholder="e.g. Meta: $20k/mo, TikTok: $8k/mo, Google: $5k/mo..." rows={2} />
      </div>
    </div>
  );
}

function StrategyGoalsSection({ data, set }: { data: FormData; set: (d: Partial<FormData>) => void }) {
  return (
    <div className="cg-section-content">
      <h2 className="cg-section-title"><Target size={20} /> Creative Strategy Goals</h2>

      <div className="cg-field-group">
        <FieldLabel>CAMPAIGN OBJECTIVES</FieldLabel>
        <FieldHint>What are you trying to achieve with your ad creative?</FieldHint>
        <TextArea value={data.campaignObjectives} onChange={(v) => set({ campaignObjectives: v })} placeholder="e.g. Scale cold prospecting with video ads, improve retargeting ROAS, build brand awareness with top-of-funnel content..." rows={4} />
      </div>

      <div className="cg-field-group">
        <FieldLabel>FUNNEL STAGES</FieldLabel>
        <FieldHint>Which funnel stages need the most creative attention?</FieldHint>
        <TextArea value={data.funnelStages} onChange={(v) => set({ funnelStages: v })} placeholder="e.g. Top-of-funnel awareness (60% of budget), Mid-funnel consideration (25%), Bottom-funnel conversion (15%)..." rows={3} />
      </div>

      <div className="cg-field-group">
        <FieldLabel>CTA PREFERENCES</FieldLabel>
        <FieldHint>What calls-to-action work best for your brand?</FieldHint>
        <TextArea value={data.ctaPreferences} onChange={(v) => set({ ctaPreferences: v })} placeholder='e.g. "Shop Now" for BOFU, "Learn More" for TOFU, avoid "Buy Now" — feels too pushy for our audience...' rows={3} />
      </div>
    </div>
  );
}

function AssetsSection({ data, set }: { data: FormData; set: (d: Partial<FormData>) => void }) {
  return (
    <div className="cg-section-content">
      <h2 className="cg-section-title"><Upload size={20} /> Brand Assets</h2>

      <div className="cg-field-group">
        <FieldLabel>BRAND COLORS</FieldLabel>
        <FieldHint>Set your primary, secondary, and accent colors.</FieldHint>
        <div className="cg-color-grid">
          <div className="cg-color-field">
            <span className="cg-pair-label">PRIMARY</span>
            <div className="cg-color-input-wrap">
              <input type="color" className="cg-color-picker" value={data.primaryColor} onChange={(e) => set({ primaryColor: e.target.value })} />
              <TextInput small value={data.primaryColor} onChange={(v) => set({ primaryColor: v })} placeholder="#7c5cfc" />
            </div>
          </div>
          <div className="cg-color-field">
            <span className="cg-pair-label">SECONDARY</span>
            <div className="cg-color-input-wrap">
              <input type="color" className="cg-color-picker" value={data.secondaryColor} onChange={(e) => set({ secondaryColor: e.target.value })} />
              <TextInput small value={data.secondaryColor} onChange={(v) => set({ secondaryColor: y })} placeholder="#1e293b" />
            </div>
          </div>
          <div className="cg-color-field">
            <span className="cg-pair-label">ACCENT</span>
            <div className="cg-color-input-wrap">
              <input type="color" className="cg-color-picker" value={data.accentColor} onChange={(e) => set({ accentColor: e.target.value })} />
              <TextInput small value={data.accentColor} onChange={(v) => set({ accentColor: v })} placeholder="#f59e0b" />
            </div>
          </div>
        </div>
      </div>

      <div className="cg-field-group">
        <FieldLabel>FONTS</FieldLabel>
        <FieldHint>What typefaces does your brand use?</FieldHint>
        <div className="cg-pair-fields">
          <div className="cg-pair-field">
            <span className="cg-pair-label">PRIMARY FONT</span>
            <TextInput value={data.fontPrimary} onChange={(v) => set({ fontPrimary: v })} placeholder="e.g. Inter, Montserrat" />
          </div>
          <div className="cg-pair-field">
            <span className="cg-pair-label">SECONDARY FONT</span>
            <TextInput value={data.fontSecondary} onChange={(v) => set({ fontSecondary: v })} placeholder="e.g. Georgia, Playfair Display" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Content router ──────────────────────────────────────────── */

function SectionContent({ activeItem, data, set }: { activeItem: string; data: FormData; set: (d: Partial<FormData>) => void }) {
  switch (activeItem) {
    case "voice": return <VoiceSection data={data} set={set} />;
    case "products": return <ProductsSection data={data} set={set} />;
    case "competitors": return <CompetitorsSection data={data} set={set} />;
    case "personas": return <PersonasSection data={data} set={set} />;
    case "founder": return <FounderSection data={data} set={set} />;
    case "calendar": return <CalendarSection data={data} set={set} />;
    case "compliance": return <ComplianceSection data={data} set={set} />;
    case "testing": return <TestingSection data={data} set={set} />;
    case "creative-bg": return <CreativeBgSection data={data} set={set} />;
    case "constraints": return <ConstraintsSection data={data} set={set} />;
    case "ad-accounts": return <AdAccountsSection data={data} set={set} />;
    case "strategy-goals": return <StrategyGoalsSection data={data} set={set} />;
    case "assets": return <AssetsSection data={data} set={set} />;
    default: return null;
  }
}

/* ── Helper: check if a sub-item has data ────────────────────── */

function itemHasData(id: string, data: FormData): boolean {
  switch (id) {
    case "voice": return !!(data.toneOfVoice || data.brandPersonality || data.voiceMoreOf || data.voiceLessOf);
    case "products": return !!(data.productDescription || data.usp || data.differentiators);
    case "competitors": return data.competitors.some((c) => c.website || c.notes);
    case "personas": return !!(data.targetAudience || data.demographics || data.painPoints);
    case "founder": return !!(data.founderStory || data.mission);
    case "calendar": return !!(data.keyDates || data.seasonalCampaigns);
    case "compliance": return !!(data.regulations || data.disclaimers || data.restrictedClaims);
    case "testing": return !!(data.testingHypotheses || data.kpis);
    case "creative-bg": return !!(data.pastCampaigns || data.stylePreferences);
    case "constraints": return !!(data.budgetRange || data.turnaround || data.approvalWorkflow);
    case "ad-accounts": return !!(data.platforms || data.pixelIds || data.spendTargets);
    case "strategy-goals": return !!(data.campaignObjectives || data.funnelStages || data.ctaPreferences);
    case "assets": return !!(data.fontPrimary || data.fontSecondary);
    default: return false;
  }
}

/* ── Main component ──────────────────────────────────────────── */

export function ClientGeneratorPage() {
  const [activeItem, setActiveItem] = useState("voice");
  const [data, setData] = useState<FormData>(INITIAL_DATA);
  const [saving, setSaving] = useState(false);

  const set = useCallback((partial: Partial<FormData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  /* Progress calculation */
  const filledCount = ALL_ITEMS.filter((id) => itemHasData(id, data)).length;
  const progressPct = Math.round((filledCount / ALL_ITEMS.length) * 100);

  const handleSave = async () => {
    setSaving(true);
    // TODO: wire up to Supabase
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
  };

  return (
    <div className="cg-page">
      {/* Header */}
      <div className="cg-header">
        <div>
          <h1 className="cg-title">Client Generator</h1>
          <p className="cg-subtitle">Help AdGen understand your brand</p>
        </div>
        <button className="cg-save-btn" onClick={handleSave} disabled={saving}>
          <Save size={16} />
          {saving ? " Saving..." : " Save Context"}
        </button>
      </div>

      {/* Progress bar */}
      <div className="cg-progress-wrap">
        <div className="cg-progress-bar">
          <div className="cg-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <span className="cg-progress-pct">{progressPct}%</span>
      </div>

      {/* Main layout */}
      <div className="cg-layout">
        {/* Left nav */}
        <nav className="cg-nav">
          {SECTIONS.map((section) => (
            <div key={section.id} className="cg-nav-section">
              <div className="cg-nav-section-header">
                <div className="cg-nav-number">{section.number}</div>
                <div>
                  <div className="cg-nav-title">{section.title}</div>
                  <div className="cg-nav-subtitle">{section.subtitle}</div>
                </div>
              </div>
              {section.items.map((item) => (
                <button
                  key={item.id}
                  className={`cg-nav-item${activeItem === item.id ? " cg-nav-item-active" : ""}`}
                  onClick={() => setActiveItem(item.id)}
                >
                  <span className={`cg-nav-dot${itemHasData(item.id, data) ? " cg-nav-dot-done" : ""}`}>
                    {itemHasData(item.id, data) ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                  </span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Content panel */}
        <div className="cg-content">
          <SectionContent activeItem={activeItem} data={data} set={set} />

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--border, #2d3748)" }}>
            <button className="cg-save-btn" onClick={handleSave} disabled={saving}>
              <Save size={16} />
              {saving ? " Saving..." : " Save Answers"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
