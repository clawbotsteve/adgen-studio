"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
  Target,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  ChevronRight,
  ChevronDown,
  Save,
  FileText,
  FolderOpen,
  X,
  UserPlus,
  Building2,
  Camera,
  Sparkles,
  Image,
} from "lucide-react";

/* ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Section / sub-item definitions ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ */

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
      { id: "testing", label: "Testing Priorities", icon: <FlaskConical size={15} /> },
    ],
  },
  {
    id: "creative-ops",
    number: 3,
    title: "Creative Ops",
    subtitle: "Execution & Logistics",
    items: [
      { id: "strategy-goals", label: "Creative Strategy Goals", icon: <Target size={15} /> },
          { id: "top-creatives", label: "Top Creatives" },
    ],
  },
  {
    id: "brand-docs",
    number: 4,
    title: "Brand Documents",
    subtitle: "Upload Reference Files",
    items: [
      { id: "documents", label: "Upload Brand Docs", icon: <FileText size={15} /> },
    ],
  },
  {
    id: "content-gen",
    number: 5,
    title: "Content Generation",
    subtitle: "AI Image Preferences",
    items: [
      { id: "content-types", label: "Content Types & Styles", icon: <Camera size={15} /> },
      { id: "scenes", label: "Scenes & Settings", icon: <Image size={15} /> },
      { id: "generation-notes", label: "Generation Notes", icon: <Sparkles size={15} /> },
    ],
  },
];

const ALL_ITEMS = SECTIONS.flatMap((s) => s.items.map((i) => i.id));

/* ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Client types ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ */

interface ClientProfile {
  id: string;
  name: string;
  industry: string;
  website: string;
  createdAt: string;
}

interface BrandDoc {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedAt: string;
}

/* ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Reusable form components ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ */

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

/* ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Form data types ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ */

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
  /* Content Generation */
  contentTypes: string;
  imageStyle: string;
  scenesAndSettings: string;
  modelPreferences: string;
  propsAndProducts: string;
  moodAndLighting: string;
  compositionNotes: string;
  referenceExamples: string;
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
  /* Content Generation */
  contentTypes: "",
  imageStyle: "",
  scenesAndSettings: "",
  modelPreferences: "",
  propsAndProducts: "",
  moodAndLighting: "",
  compositionNotes: "",
  referenceExamples: "",
};

/* ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Client Selector Bar ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ */

function ClientSelectorBar({
  clients,
  selectedClient,
  onSelect,
  onCreateNew,
  newClientName,
  setNewClientName,
  newClientIndustry,
  setNewClientIndustry,
  newClientWebsite,
  setNewClientWebsite,
  showNewForm,
  setShowNewForm,
  onDeleteClient,
}: {
  clients: ClientProfile[];
  selectedClient: ClientProfile | null;
  onSelect: (id: string) => void;
  onCreateNew: () => void;
  newClientName: string;
  setNewClientName: (v: string) => void;
  newClientIndustry: string;
  setNewClientIndustry: (v: string) => void;
  newClientWebsite: string;
  setNewClientWebsite: (v: string) => void;
  showNewForm: boolean;
  setShowNewForm: (v: boolean) => void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="cg-client-bar">
      <div className="cg-client-bar-inner">
        {/* Client dropdown */}
        <div className="cg-client-selector">
          <button
            className="cg-client-dropdown-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <Building2 size={16} />
            <span>{selectedClient ? selectedClient.name : "Select a client..."}</span>
            <ChevronDown size={14} className={dropdownOpen ? "cg-chevron-flip" : ""} />
          </button>

          {dropdownOpen && (
            <div className="cg-client-dropdown">
              {clients.length === 0 && (
                <div className="cg-client-dropdown-empty">
                  No clients yet. Create your first one below.
                </div>
              )}
              {clients.map((client) => (
                <button
                  key={client.id}
                  className={`cg-client-dropdown-item${selectedClient?.id === client.id ? " cg-client-dropdown-item-active" : ""}`}
                  onClick={() => {
                    onSelect(client.id);
                    setDropdownOpen(false);
                  }}
                >
                  <div className="cg-client-dropdown-item-info">
                    <span className="cg-client-dropdown-item-name">{client.name}</span>
                    {client.industry && (
                      <span className="cg-client-dropdown-item-industry">{client.industry}</span>
                    )}
                  </div>
                  <div className="cg-client-dropdown-item-actions">
                    {selectedClient?.id === client.id && <CheckCircle2 size={14} />}
                    <button
                      className="cg-client-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteClient(client.id);
                      }}
                      title="Remove client"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* New client button */}
        <button
          className="cg-new-client-btn"
          onClick={() => {
            setShowNewForm(!showNewForm);
            setDropdownOpen(false);
          }}
        >
          <UserPlus size={16} />
          New Client
        </button>
      </div>

      {/* New client form (expandable) */}
      {showNewForm && (
        <div className="cg-new-client-form">
          <div className="cg-new-client-form-header">
            <h3>Create New Client Profile</h3>
            <button className="cg-icon-btn" onClick={() => setShowNewForm(false)}>
              <X size={16} />
            </button>
          </div>
          <div className="cg-new-client-fields">
            <div className="cg-new-client-field">
              <label>Client / Brand Name *</label>
              <input
                type="text"
                className="cg-input"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="e.g. Acme Fitness Co."
              />
            </div>
            <div className="cg-new-client-field">
              <label>Industry</label>
              <input
                type="text"
                className="cg-input"
                value={newClientIndustry}
                onChange={(e) => setNewClientIndustry(e.target.value)}
                placeholder="e.g. Health & Fitness, SaaS, E-commerce..."
              />
            </div>
            <div className="cg-new-client-field">
              <label>Website</label>
              <input
                type="text"
                className="cg-input"
                value={newClientWebsite}
                onChange={(e) => setNewClientWebsite(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>
          <button
            className="cg-save-btn"
            onClick={onCreateNew}
            disabled={!newClientName.trim()}
            style={{ marginTop: "12px" }}
          >
            <Plus size={16} /> Create Client
          </button>
        </div>
      )}
    </div>
  );
}

/* ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Section content renderers ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ */

function VoiceSection({ data, set }: { data: FormData; set: (d: Partial<FormData>) => void }) {
  return (
    <div className="cg-section-content">
      <h2 className="cg-section-title"><Mic size={20} /> Brand Voice &amp; Guidelines</h2>

      <div className="cg-field-group">
        <FieldLabel>TONE OF VOICE</FieldLabel>
        <FieldHint>Describe how your brand speaks ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ formal, casual, witty, authoritative, etc.</FieldHint>
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
        <TextArea value={data.ctaPreferences} onChange={(v) => set({ ctaPreferences: v })} placeholder='e.g. "Shop Now" for BOFU, "Learn More" for TOFU, avoid "Buy Now" ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ feels too pushy for our audience...' rows={3} />
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
              <TextInput small value={data.secondaryColor} onChange={(v) => set({ secondaryColor: v })} placeholder="#1e293b" />
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

/* ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Brand Documents Upload Section ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ */

function BrandDocsSection({
  docs,
  onUpload,
  onRemove,
  dragActive,
  setDragActive,
  fileInputRef,
}: {
  docs: BrandDoc[];
  onUpload: (files: FileList) => void;
  onRemove: (id: string) => void;
  dragActive: boolean;
  setDragActive: (v: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files);
    }
  };

  return (
    <div className="cg-section-content">
      <h2 className="cg-section-title"><FileText size={20} /> Brand Documents</h2>
      <FieldHint>
        Upload brand guides, style sheets, past ad reports, product catalogs, or any reference documents.
        These help the AI generate content that is perfectly aligned with your brand.
      </FieldHint>

      {/* Drop zone */}
      <div
        className={`cg-dropzone${dragActive ? " cg-dropzone-active" : ""}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.png,.jpg,.jpeg,.svg,.pptx"
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onUpload(e.target.files);
              e.target.value = "";
            }
          }}
        />
        <div className="cg-dropzone-content">
          <FolderOpen size={32} className="cg-dropzone-icon" />
          <p className="cg-dropzone-title">
            {dragActive ? "Drop files here..." : "Drag & drop files here, or click to browse"}
          </p>
          <p className="cg-dropzone-subtitle">
            PDF, Word, Excel, PowerPoint, images, and text files accepted
          </p>
        </div>
      </div>

      {/* Uploaded files list */}
      {docs.length > 0 && (
        <div className="cg-docs-list">
          <FieldLabel>UPLOADED DOCUMENTS ({docs.length})</FieldLabel>
          {docs.map((doc) => (
            <div key={doc.id} className="cg-doc-card">
              <div className="cg-doc-info">
                <FileText size={18} className="cg-doc-icon" />
                <div>
                  <div className="cg-doc-name">{doc.name}</div>
                  <div className="cg-doc-meta">{doc.type.toUpperCase()} &middot; {doc.size} &middot; {doc.uploadedAt}</div>
                </div>
              </div>
              <button className="cg-icon-btn cg-doc-remove" onClick={() => onRemove(doc.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="cg-field-group" style={{ marginTop: "24px" }}>
        <FieldLabel>SUGGESTED UPLOADS</FieldLabel>
        <div className="cg-suggested-uploads">
          <div className="cg-suggested-item">
            <CheckCircle2 size={14} className="cg-suggested-icon" />
            <span>Brand style guide / brand book</span>
          </div>
          <div className="cg-suggested-item">
            <CheckCircle2 size={14} className="cg-suggested-icon" />
            <span>Product catalog or line sheet</span>
          </div>
          <div className="cg-suggested-item">
            <CheckCircle2 size={14} className="cg-suggested-icon" />
            <span>Past ad performance reports</span>
          </div>
          <div className="cg-suggested-item">
            <CheckCircle2 size={14} className="cg-suggested-icon" />
            <span>Competitor analysis documents</span>
          </div>
          <div className="cg-suggested-item">
            <CheckCircle2 size={14} className="cg-suggested-icon" />
            <span>Customer research / survey results</span>
          </div>
          <div className="cg-suggested-item">
            <CheckCircle2 size={14} className="cg-suggested-icon" />
            <span>Logo files and brand assets (PNG, SVG)</span>
          </div>
        </div>
      </div>
    </div>
  );
}


/* Content Types & Styles section */
function ContentTypesSection({ data, set }: { data: FormData; set: (d: Partial<FormData>) => void }) {
  return (
    <div className="cg-section-content">
      <h2 className="cg-section-title"><Camera size={20} /> Content Types & Styles</h2>
      <FieldHint>
        Describe the types of AI-generated images you want. What categories of content does this brand need?
      </FieldHint>
      <div className="cg-field-group">
        <label className="cg-label">Content Types</label>
        <textarea className="cg-textarea" rows={3} placeholder="e.g., Product hero shots, lifestyle scenes, flat lays, social media posts, banner ads..."
          value={data.contentTypes} onChange={(e) => set({ contentTypes: e.target.value })} />
      </div>
      <div className="cg-field-group">
        <label className="cg-label">Image Style & Aesthetic</label>
        <textarea className="cg-textarea" rows={3} placeholder="e.g., Clean minimalist, warm and cozy, bold and vibrant, editorial, cinematic..."
          value={data.imageStyle} onChange={(e) => set({ imageStyle: e.target.value })} />
      </div>
      <div className="cg-field-group">
        <label className="cg-label">Model / Subject Preferences</label>
        <textarea className="cg-textarea" rows={3} placeholder="e.g., Diverse models ages 25-35, no models (product only), hands holding product..."
          value={data.modelPreferences} onChange={(e) => set({ modelPreferences: e.target.value })} />
      </div>
    </div>
  );
}

/* Scenes & Settings section */
function ScenesSection({ data, set }: { data: FormData; set: (d: Partial<FormData>) => void }) {
  return (
    <div className="cg-section-content">
      <h2 className="cg-section-title"><Image size={20} /> Scenes & Settings</h2>
      <FieldHint>
        Describe the environments, backgrounds, and physical settings for your AI images.
      </FieldHint>
      <div className="cg-field-group">
        <label className="cg-label">Scenes & Settings</label>
        <textarea className="cg-textarea" rows={3} placeholder="e.g., Modern kitchen, outdoor patio, studio with white backdrop, urban street corner..."
          value={data.scenesAndSettings} onChange={(e) => set({ scenesAndSettings: e.target.value })} />
      </div>
      <div className="cg-field-group">
        <label className="cg-label">Props & Product Placement</label>
        <textarea className="cg-textarea" rows={3} placeholder="e.g., Coffee mug nearby, flowers in background, product centered on marble surface..."
          value={data.propsAndProducts} onChange={(e) => set({ propsAndProducts: e.target.value })} />
      </div>
      <div className="cg-field-group">
        <label className="cg-label">Mood & Lighting</label>
        <textarea className="cg-textarea" rows={3} placeholder="e.g., Warm golden hour, soft diffused, dramatic shadows, bright and airy..."
          value={data.moodAndLighting} onChange={(e) => set({ moodAndLighting: e.target.value })} />
      </div>
    </div>
  );
}

/* Generation Notes section */
function GenerationNotesSection({ data, set }: { data: FormData; set: (d: Partial<FormData>) => void }) {
  return (
    <div className="cg-section-content">
      <h2 className="cg-section-title"><Sparkles size={20} /> Generation Notes</h2>
      <FieldHint>
        Any additional instructions, composition preferences, or reference examples for AI image generation.
      </FieldHint>
      <div className="cg-field-group">
        <label className="cg-label">Composition & Framing Notes</label>
        <textarea className="cg-textarea" rows={3} placeholder="e.g., Rule of thirds, centered product, close-up details, wide angle establishing shots..."
          value={data.compositionNotes} onChange={(e) => set({ compositionNotes: e.target.value })} />
      </div>
      <div className="cg-field-group">
        <label className="cg-label">Reference Examples & Inspiration</label>
        <textarea className="cg-textarea" rows={4} placeholder="Describe or paste links to reference images, competitor examples, mood boards, or inspiration..."
          value={data.referenceExamples} onChange={(e) => set({ referenceExamples: e.target.value })} />
      </div>
    </div>
  );
}
/* ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Content router ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ */

function SectionContent({
  activeItem,
  data,
  set,
  docs,
  onUpload,
  onRemoveDoc,
  dragActive,
  setDragActive,
  fileInputRef,
}: {
  activeItem: string;
  data: FormData;
  set: (d: Partial<FormData>) => void;
  docs: BrandDoc[];
  onUpload: (files: FileList) => void;
  onRemoveDoc: (id: string) => void;
  dragActive: boolean;
  setDragActive: (v: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  switch (activeItem) {
    case "voice": return <VoiceSection data={data} set={set} />;
    case "products": return <ProductsSection data={data} set={set} />;
    case "competitors": return <CompetitorsSection data={data} set={set} />;
    case "personas": return <PersonasSection data={data} set={set} />;
    case "founder": return <FounderSection data={data} set={set} />;
    case "calendar": return <CalendarSection data={data} set={set} />;
    case "testing": return <TestingSection data={data} set={set} />;
    case "strategy-goals": return <StrategyGoalsSection data={data} set={set} />;
    case "documents": return (
      <BrandDocsSection
        docs={docs}
        onUpload={onUpload}
        onRemove={onRemoveDoc}
        dragActive={dragActive}
        setDragActive={setDragActive}
        fileInputRef={fileInputRef}
      />
    );
    case "content-types": return <ContentTypesSection data={data} set={set} />;
    case "scenes": return <ScenesSection data={data} set={set} />;
    case "generation-notes": return <GenerationNotesSection data={data} set={set} />;
      case "top-creatives":
        return (
          <SectionPanel title="Top Creatives" desc="Upload your best-performing ad creatives (8–20 images). Smart Batch uses these as visual references.">
            <div style={{marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:13,fontWeight:600}}>{topCreatives.length} / 20 images {topCreatives.length < 8 && <span style={{color:"#ef4444",fontWeight:400,fontSize:12,marginLeft:8}}>Minimum 8 required</span>}</span>
              {topCreatives.length < 20 && (
                <button className="cg-save-section" onClick={() => tcInputRef.current?.click()} disabled={tcUploading}>
                  {tcUploading ? "Uploading..." : "+ Add Images"}
                </button>
              )}
              <input ref={tcInputRef} type="file" accept="image/png,image/jpeg,image/webp" multiple style={{display:"none"}} onChange={(e) => { const files = e.target.files; if (!files) return; const remaining = 20 - topCreatives.length; Array.from(files).slice(0, remaining).forEach(f => uploadTopCreative(f)); if (tcInputRef.current) tcInputRef.current.value = ""; }} />
            </div>
            {topCreatives.length > 0 && (
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))",gap:8}}>
                {topCreatives.map((tc) => (
                  <div key={tc.id} style={{position:"relative",aspectRatio:"1",borderRadius:8,overflow:"hidden",border:"1px solid var(--color-border)"}}>
                    <img src={tc.url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} />
                    <button onClick={() => deleteTopCreative(tc.id)} style={{position:"absolute",top:4,right:4,background:"rgba(0,0,0,0.7)",color:"#fff",border:"none",borderRadius:"50%",width:22,height:22,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>x</button>
                  </div>
                ))}
              </div>
            )}
            {topCreatives.length === 0 && !tcUploading && (
              <div onClick={() => tcInputRef.current?.click()} style={{border:"2px dashed var(--color-border)",borderRadius:12,padding:"40px 20px",textAlign:"center",cursor:"pointer",color:"var(--color-text-secondary)"}}>
                <div style={{fontSize:32,marginBottom:8}}>+</div>
                <div style={{fontSize:14,fontWeight:500}}>Upload your top-performing creatives</div>
                <div style={{fontSize:12,marginTop:4}}>PNG, JPEG, WebP · Max 10MB each</div>
              </div>
            )}
          </SectionPanel>
        );
    default: return null;
  }
}

/* ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Helper: check if a sub-item has data ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ */

function itemHasData(id: string, data: FormData, docs: BrandDoc[], topCreativesCount?: number): boolean {
  switch (id) {
    case "voice": return !!(data.toneOfVoice || data.brandPersonality || data.voiceMoreOf || data.voiceLessOf);
    case "products": return !!(data.productDescription || data.usp || data.differentiators);
    case "competitors": return data.competitors.some((c) => c.website || c.notes);
    case "personas": return !!(data.targetAudience || data.demographics || data.painPoints);
    case "founder": return !!(data.founderStory || data.mission);
    case "calendar": return !!(data.keyDates || data.seasonalCampaigns);
    case "testing": return !!(data.testingHypotheses || data.kpis);
    case "strategy-goals": return !!(data.campaignObjectives || data.funnelStages || data.ctaPreferences);
    case "documents": return docs.length > 0;
    case "content-types": return !!(data.contentTypes || data.imageStyle || data.modelPreferences);
    case "scenes": return !!(data.scenesAndSettings || data.propsAndProducts || data.moodAndLighting);
    case "generation-notes": return !!(data.compositionNotes || data.referenceExamples);
      case "top-creatives": return (topCreativesCount ?? 0) >= 8;
    default: return false;
  }
}

/* ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Main component ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ */

export function ClientGeneratorPage({ initialClients = [] }: { initialClients?: Array<{ id: string; name: string; defaults?: Record<string, unknown> | null; created_at?: string }> }) {
  /* Client management */
  const [clients, setClients] = useState<ClientProfile[]>(() =>
    initialClients.map((c) => ({
      id: c.id,
      name: c.name,
      industry: (c.defaults as Record<string, string>)?.industry || "",
      website: (c.defaults as Record<string, string>)?.website || "",
      createdAt: c.created_at || new Date().toISOString(),
    }))
  );
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientIndustry, setNewClientIndustry] = useState("");
  const [newClientWebsite, setNewClientWebsite] = useState("");

  /* Active section + form state */
  const [activeItem, setActiveItem] = useState("voice");
  const [data, setData] = useState<FormData>(INITIAL_DATA);
  const [saving, setSaving] = useState(false);

  /* Brand documents */
  const [docs, setDocs] = useState<BrandDoc[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [topCreatives, setTopCreatives] = useState<{id:string;url:string}[]>([]);
  const [tcUploading, setTcUploading] = useState(false);
  const tcInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);


  // Top Creatives API
  const loadTopCreatives = async (cid: string) => {
    try {
      const r = await fetch(`/api/top-creatives?clientId=${cid}`);
      if (r.ok) { const d = await r.json(); setTopCreatives(d.creatives || []); }
      else setTopCreatives([]);
    } catch { setTopCreatives([]); }
  };

  const uploadTopCreative = async (file: File) => {
    if (!selectedClient) return;
    setTcUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("clientId", selectedClient);
      const r = await fetch("/api/top-creatives/upload", { method: "POST", body: fd });
      if (r.ok) { const c = await r.json(); setTopCreatives(prev => [...prev, c]); }
    } catch { /* ignore */ }
    finally { setTcUploading(false); }
  };

  const deleteTopCreative = async (id: string) => {
    try {
      await fetch(`/api/top-creatives/${id}`, { method: "DELETE" });
      setTopCreatives(prev => prev.filter(c => c.id !== id));
    } catch { /* ignore */ }
  };

  const set = useCallback((partial: Partial<FormData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  /* Client actions */
  const handleSelectClient = async (id: string) => {
    const client = clients.find((c) => c.id === id);
    if (client) {
      setSelectedClient(client);
      setDocs([]);
      try {
        const resp = await fetch(`/api/clients/${id}`);
        if (resp.ok) {
          const { client: full } = await resp.json();
          if (full?.defaults?.formData) {
            setData(full.defaults.formData);
        loadTopCreatives(c.id);
          } else {
            setData(INITIAL_DATA);
          }
        } else {
          setData(INITIAL_DATA);
        }
      } catch {
        setData(INITIAL_DATA);
      }
    }
  };

  const handleCreateClient = async () => {
    if (!newClientName.trim()) return;
    try {
      const resp = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newClientName.trim(),
          defaults: {
            industry: newClientIndustry.trim(),
            website: newClientWebsite.trim(),
          },
        }),
      });
      if (resp.ok) {
        const { client } = await resp.json();
        const newProfile: ClientProfile = {
          id: client.id,
          name: client.name,
          industry: client.defaults?.industry || "",
          website: client.defaults?.website || "",
          createdAt: client.created_at,
        };
        setClients((prev) => [newProfile, ...prev]);
        setSelectedClient(newProfile);
        loadTopCreatives(newProfile.id);
        setNewClientName("");
        setNewClientIndustry("");
        setNewClientWebsite("");
        setShowNewForm(false);
        setData(INITIAL_DATA);
        setDocs([]);
      }
    } catch (err) {
      console.error("Failed to create client:", err);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      await fetch(`/api/clients/${clientId}`, { method: "DELETE" });
      setClients((prev) => prev.filter((c) => c.id !== clientId));
      if (selectedClient?.id === clientId) {
        setSelectedClient(null);
        loadTopCreatives(null.id);
        setData(INITIAL_DATA);
        setDocs([]);
      }
    } catch (err) {
      console.error("Failed to delete client:", err);
    }
  };

  /* File upload handler */
  const handleUploadFiles = (files: FileList) => {
    const newDocs: BrandDoc[] = Array.from(files).map((file) => ({
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: file.name,
      size: file.size < 1024 * 1024
        ? `${(file.size / 1024).toFixed(1)} KB`
        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      type: file.name.split(".").pop() || "unknown",
      uploadedAt: new Date().toLocaleDateString(),
    }));
    setDocs((prev) => [...prev, ...newDocs]);
    // TODO: upload to Supabase Storage
  };

  const handleRemoveDoc = (id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
    // TODO: remove from Supabase Storage
  };

  /* Progress calculation */
  const filledCount = ALL_ITEMS.filter((id) => itemHasData(id, data, docs, topCreatives.length)).length;
  const progressPct = Math.round((filledCount / ALL_ITEMS.length) * 100);

  const handleSave = async () => {
    if (!selectedClient) return;
    setSaving(true);
    try {
      await fetch(`/api/clients/${selectedClient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaults: { formData: data, docs: docs.map((d) => ({ name: d.name, type: d.type })) },
        }),
      });
    } catch (err) {
      console.error("Failed to save profile:", err);
    }
    setSaving(false);
  };

  return (
    <div className="cg-page">
      {/* Header */}
      <div className="cg-header">
        <div>
          <h1 className="cg-title">Client Generator</h1>
          <p className="cg-subtitle">Build a complete client profile to help the AI generate better content</p>
        </div>
        <button className="cg-save-btn" onClick={handleSave} disabled={saving || !selectedClient}>
          <Save size={16} />
          {saving ? " Saving..." : " Save Profile"}
        </button>
      </div>

      {/* Client selector bar */}
      <ClientSelectorBar
        clients={clients}
        selectedClient={selectedClient}
        onSelect={handleSelectClient}
        onCreateNew={handleCreateClient}
        newClientName={newClientName}
        setNewClientName={setNewClientName}
        newClientIndustry={newClientIndustry}
        setNewClientIndustry={setNewClientIndustry}
        newClientWebsite={newClientWebsite}
        setNewClientWebsite={setNewClientWebsite}
        showNewForm={showNewForm}
        setShowNewForm={setShowNewForm}
        onDeleteClient={handleDeleteClient}
      />

      {/* Show workflow only when a client is selected */}
      {selectedClient ? (
        <>
          {/* Progress bar */}
          <div className="cg-progress-wrap">
            <div className="cg-progress-info">
              <span className="cg-progress-label">Profile completion for <strong>{selectedClient.name}</strong></span>
              <span className="cg-progress-pct">{progressPct}%</span>
            </div>
            <div className="cg-progress-bar">
              <div className="cg-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
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
                      <span className={`cg-nav-dot${itemHasData(item.id, data, docs, topCreatives.length) ? " cg-nav-dot-done" : ""}`}>
                        {itemHasData(item.id, data, docs, topCreatives.length) ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                      </span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              ))}
            </nav>

            {/* Content panel */}
            <div className="cg-content">
              <SectionContent
                activeItem={activeItem}
                data={data}
                set={set}
                docs={docs}
                onUpload={handleUploadFiles}
                onRemoveDoc={handleRemoveDoc}
                dragActive={dragActive}
                setDragActive={setDragActive}
                fileInputRef={fileInputRef}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--border, #2d3748)" }}>
                <button className="cg-save-btn" onClick={handleSave} disabled={saving}>
                  <Save size={16} />
                  {saving ? " Saving..." : " Save Answers"}
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Empty state when no client selected */
        <div className="cg-empty-state">
          <Building2 size={48} className="cg-empty-icon" />
          <h2 className="cg-empty-title">Select or create a client to get started</h2>
          <p className="cg-empty-subtitle">
            Each client profile helps the AI understand the brand deeply ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ from voice and audience
            to creative strategy and assets. Upload brand docs and fill out the profile to unlock
            smarter, on-brand content generation.
          </p>
          <button className="cg-save-btn" onClick={() => setShowNewForm(true)} style={{ marginTop: "8px" }}>
            <UserPlus size={16} /> Create Your First Client
          </button>
        </div>
      )}
    </div>
  );
}
