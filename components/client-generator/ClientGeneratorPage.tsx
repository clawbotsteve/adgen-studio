"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/lib/hooks/useToast";

/* ── Types ───────────────────────────────────────────────── */

type ClientOption = { id: string; name: string };

type BrandContext = {
  id?: string;
  brand_guidelines: string;
  products: string;
  competitive_landscape: string;
  customer_personas: string;
  founder_story: string;
  marketing_calendar: string;
  compliance_legal: string;
  testing_priorities: string;
  creative_background: string;
  creative_ops_constraints: string;
  ad_account_details: string;
  goals: string;
  // Parker-style fields
  positioning_more: string;
  positioning_less: string;
  vocabulary_use: string;
  vocabulary_avoid: string;
  associations_with: string;
  associations_not: string;
  font_primary: string;
  font_secondary: string;
  color_primary: string;
  color_secondary: string;
  color_accent: string;
};

type DocFile = {
  id: string;
  file_name: string;
  file_type: string;
  storage_url: string;
  created_at: string;
};

const EMPTY_CONTEXT: BrandContext = {
  brand_guidelines: "",
  products: "",
  competitive_landscape: "",
  customer_personas: "",
  founder_story: "",
  marketing_calendar: "",
  compliance_legal: "",
  testing_priorities: "",
  creative_background: "",
  creative_ops_constraints: "",
  ad_account_details: "",
  goals: "",
  positioning_more: "",
  positioning_less: "",
  vocabulary_use: "",
  vocabulary_avoid: "",
  associations_with: "",
  associations_not: "",
  font_primary: "",
  font_secondary: "",
  color_primary: "#3060ff",
  color_secondary: "#121a2f",
  color_accent: "#ff6b35",
};

/* ── Section definitions (Parker-style) ──────────────────── */

type SectionItem = {
  key: string;
  label: string;
  completed?: boolean;
};

type Section = {
  number: number;
  title: string;
  subtitle: string;
  items: SectionItem[];
};

const SECTIONS: Section[] = [
  {
    number: 1,
    title: "Brand DNA",
    subtitle: "Identity & Core Values",
    items: [
      { key: "brand-voice", label: "Brand Voice & Guidelines" },
      { key: "products-usp", label: "Products & USP" },
      { key: "competitive", label: "Competitive Landscape" },
      { key: "personas", label: "Customer Personas" },
      { key: "founder", label: "Founder Story" },
    ],
  },
  {
    number: 2,
    title: "Strategy",
    subtitle: "Market Position & Testing",
    items: [
      { key: "marketing-cal", label: "Marketing Calendar" },
      { key: "compliance", label: "Compliance & Legal" },
      { key: "testing", label: "Testing Priorities" },
      { key: "creative-bg", label: "Creative Background" },
    ],
  },
  {
    number: 3,
    title: "Creative Ops",
    subtitle: "Execution & Logistics",
    items: [
      { key: "ops-constraints", label: "Creative Ops Constraints" },
      { key: "ad-account", label: "Ad Account Details" },
      { key: "goals", label: "Creative Strategy Goals" },
      { key: "fonts-colors", label: "Fonts & Colors" },
    ],
  },
];

/* ── Component ───────────────────────────────────────────── */

export function ClientGeneratorPage({ tenantId }: { tenantId: string }) {
  const { toast } = useToast();
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [newClientName, setNewClientName] = useState("");
  const [creatingClient, setCreatingClient] = useState(false);
  const [activeSection, setActiveSection] = useState("brand-voice");
  const [context, setContext] = useState<BrandContext>(EMPTY_CONTEXT);
  const [docs, setDocs] = useState<DocFile[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Fetch clients
  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setClients(data);
      })
      .catch(() => {});
  }, []);

  // Fetch brand context when client changes
  const loadContext = useCallback(
    async (clientId: string) => {
      if (!clientId) {
        setContext(EMPTY_CONTEXT);
        setDocs([]);
        return;
      }
      try {
        const r = await fetch(`/api/brand-context?clientId=${clientId}`);
        if (r.ok) {
          const data = await r.json();
          const ctx = data?.context;
          if (ctx && ctx.id) {
            setContext({ ...EMPTY_CONTEXT, ...ctx });
            // Load docs
            const dr = await fetch(
              `/api/brand-context/docs?brandContextId=${ctx.id}`
            );
            if (dr.ok) {
              const docsData = await dr.json();
              setDocs(Array.isArray(docsData) ? docsData : []);
            }
          } else {
            setContext(EMPTY_CONTEXT);
            setDocs([]);
          }
        }
      } catch {
        setContext(EMPTY_CONTEXT);
      }
    },
    []
  );

  useEffect(() => {
    if (selectedClientId) loadContext(selectedClientId);
  }, [selectedClientId, loadContext]);

  // Create new client
  const createClient = async () => {
    if (!newClientName.trim()) return;
    setCreatingClient(true);
    try {
      const r = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newClientName.trim() }),
      });
      if (r.ok) {
        const client = await r.json();
        setClients((prev) => [...prev, client]);
        setSelectedClientId(client.id);
        setNewClientName("");
        toast("Client created!", "success");
      }
    } catch {
      toast("Failed to create client", "error");
    } finally {
      setCreatingClient(false);
    }
  };

  // Build the DB-safe payload (only fields that exist as columns)
  const buildSavePayload = () => {
    // Merge Parker-style fields into brand_guidelines for richer context
    const parkerParts: string[] = [];
    if (context.positioning_more?.trim())
      parkerParts.push(`Positioning (more of): ${context.positioning_more.trim()}`);
    if (context.positioning_less?.trim())
      parkerParts.push(`Positioning (less of): ${context.positioning_less.trim()}`);
    if (context.vocabulary_use?.trim())
      parkerParts.push(`Vocabulary (use): ${context.vocabulary_use.trim()}`);
    if (context.vocabulary_avoid?.trim())
      parkerParts.push(`Vocabulary (avoid): ${context.vocabulary_avoid.trim()}`);
    if (context.associations_with?.trim())
      parkerParts.push(`Associates with: ${context.associations_with.trim()}`);
    if (context.associations_not?.trim())
      parkerParts.push(`Does not associate with: ${context.associations_not.trim()}`);
    if (context.font_primary?.trim())
      parkerParts.push(`Primary font: ${context.font_primary.trim()}`);
    if (context.font_secondary?.trim())
      parkerParts.push(`Secondary font: ${context.font_secondary.trim()}`);
    if (context.color_primary?.trim())
      parkerParts.push(`Primary color: ${context.color_primary.trim()}`);
    if (context.color_secondary?.trim())
      parkerParts.push(`Secondary color: ${context.color_secondary.trim()}`);
    if (context.color_accent?.trim())
      parkerParts.push(`Accent color: ${context.color_accent.trim()}`);

    const baseBrandGuidelines = context.brand_guidelines?.trim() || "";
    const parkerBlock = parkerParts.length > 0 ? parkerParts.join("\n") : "";
    const mergedBrandGuidelines = [baseBrandGuidelines, parkerBlock]
      .filter(Boolean)
      .join("\n\n--- Brand Identity ---\n");

    return {
      clientId: selectedClientId,
      brand_guidelines: mergedBrandGuidelines,
      products: context.products,
      competitive_landscape: context.competitive_landscape,
      customer_personas: context.customer_personas,
      founder_story: context.founder_story,
      marketing_calendar: context.marketing_calendar,
      compliance_legal: context.compliance_legal,
      testing_priorities: context.testing_priorities,
      ad_format_preferences: context.creative_background || context.ad_account_details || "",
      creative_ops_constraints: context.creative_ops_constraints,
      naming_conventions: "",
      goals: context.goals,
    };
  };

  // Save context
  const saveContext = async () => {
    if (!selectedClientId) return;
    setSaving(true);
    try {
      const payload = buildSavePayload();
      const r = await fetch("/api/brand-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (r.ok) {
        const data = await r.json();
        setContext((prev) => ({ ...prev, id: data.context?.id || data.id }));
        toast("Context saved!", "success");
      } else {
        const err = await r.json().catch(() => null);
        toast("Failed to save: " + (err?.error || "Unknown error"), "error");
      }
    } catch {
      toast("Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  // Upload PDF
  const uploadFile = async (file: File) => {
    if (!context.id && selectedClientId) {
      // Save context first to get an ID
      const payload = buildSavePayload();
      const r = await fetch("/api/brand-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (r.ok) {
        const data = await r.json();
        const ctxId = data.context?.id || data.id;
        setContext((prev) => ({ ...prev, id: ctxId }));
        await doUpload(file, ctxId);
      }
    } else if (context.id) {
      await doUpload(file, context.id);
    }
  };

  const doUpload = async (file: File, brandContextId: string) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("brandContextId", brandContextId);
      const r = await fetch("/api/brand-context/docs/upload", {
        method: "POST",
        body: fd,
      });
      if (r.ok) {
        const doc = await r.json();
        setDocs((prev) => [...prev, doc]);
        toast("File uploaded!", "success");
      }
    } catch {
      toast("Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const deleteDoc = async (docId: string) => {
    try {
      await fetch(`/api/brand-context/docs/${docId}`, { method: "DELETE" });
      setDocs((prev) => prev.filter((d) => d.id !== docId));
    } catch {
      toast("Failed to delete", "error");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  const updateField = (key: keyof BrandContext, value: string) => {
    setContext((prev) => ({ ...prev, [key]: value }));
  };

  // Calculate progress
  const totalFields = 12;
  const filledFields = [
    context.brand_guidelines,
    context.products,
    context.competitive_landscape,
    context.customer_personas,
    context.founder_story,
    context.marketing_calendar,
    context.compliance_legal,
    context.testing_priorities,
    context.creative_background,
    context.creative_ops_constraints,
    context.ad_account_details,
    context.goals,
  ].filter((v) => v && v.trim().length > 0).length;
  const progress = Math.round((filledFields / totalFields) * 100);

  // Check which items are completed
  const isItemCompleted = (key: string): boolean => {
    const map: Record<string, string[]> = {
      "brand-voice": ["brand_guidelines"],
      "products-usp": ["products"],
      competitive: ["competitive_landscape"],
      personas: ["customer_personas"],
      founder: ["founder_story"],
      "marketing-cal": ["marketing_calendar"],
      compliance: ["compliance_legal"],
      testing: ["testing_priorities"],
      "creative-bg": ["creative_background"],
      "ops-constraints": ["creative_ops_constraints"],
      "ad-account": ["ad_account_details"],
      goals: ["goals"],
      "fonts-colors": ["font_primary", "color_primary"],
    };
    const fields = map[key] || [];
    return fields.some(
      (f) =>
        context[f as keyof BrandContext] &&
        String(context[f as keyof BrandContext]).trim().length > 0
    );
  };

  /* ── Render section content ────────────────────────────── */

  const renderSectionContent = () => {
    switch (activeSection) {
      case "brand-voice":
        return (
          <div className="cg-section-content">
            <h3 className="cg-section-title">Brand Voice & Guidelines</h3>

            <div className="cg-upload-area">
              <h4 className="cg-field-label">Upload Brand Guidelines</h4>
              <div
                className={`cg-dropzone ${dragActive ? "cg-dropzone-active" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => {
                  const inp = document.createElement("input");
                  inp.type = "file";
                  inp.accept = ".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp";
                  inp.onchange = (ev) => {
                    const f = (ev.target as HTMLInputElement).files?.[0];
                    if (f) uploadFile(f);
                  };
                  inp.click();
                }}
              >
                <div className="cg-dropzone-icon">📄</div>
                <p>Drag & drop PDFs or click to select</p>
                <p className="cg-dropzone-hint">Max 50MB per file</p>
                {uploading && <p className="cg-uploading">Uploading...</p>}
              </div>

              {docs.length > 0 && (
                <div className="cg-doc-list">
                  {docs.map((d) => (
                    <div key={d.id} className="cg-doc-item">
                      <span className="cg-doc-icon">📎</span>
                      <span className="cg-doc-name">{d.file_name}</span>
                      <button
                        className="cg-doc-delete"
                        onClick={() => deleteDoc(d.id)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="cg-divider">OR</div>

            <div className="cg-field-group">
              <h4 className="cg-field-label">POSITIONING</h4>
              <div className="cg-pair-fields">
                <div className="cg-pair-field">
                  <label className="cg-pair-label">MORE OF THIS</label>
                  <textarea
                    className="cg-textarea cg-textarea-warm"
                    placeholder="Fitness, healthy, conversational, indulgent..."
                    value={context.positioning_more}
                    onChange={(e) =>
                      updateField("positioning_more", e.target.value)
                    }
                    rows={3}
                  />
                </div>
                <div className="cg-pair-field">
                  <label className="cg-pair-label">LESS OF THAT</label>
                  <textarea
                    className="cg-textarea cg-textarea-warm"
                    placeholder="Intense bodybuilding, basic, unintelligent, unhealthy..."
                    value={context.positioning_less}
                    onChange={(e) =>
                      updateField("positioning_less", e.target.value)
                    }
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="cg-field-group">
              <h4 className="cg-field-label">VOCABULARY</h4>
              <div className="cg-pair-fields">
                <div className="cg-pair-field">
                  <label className="cg-pair-label">WORDS WE USE</label>
                  <textarea
                    className="cg-textarea cg-textarea-warm"
                    placeholder="Manly, bold, premium..."
                    value={context.vocabulary_use}
                    onChange={(e) =>
                      updateField("vocabulary_use", e.target.value)
                    }
                    rows={2}
                  />
                </div>
                <div className="cg-pair-field">
                  <label className="cg-pair-label">WORDS WE DON&apos;T USE</label>
                  <textarea
                    className="cg-textarea cg-textarea-warm"
                    placeholder="Moist, cheap, discount, bae..."
                    value={context.vocabulary_avoid}
                    onChange={(e) =>
                      updateField("vocabulary_avoid", e.target.value)
                    }
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <div className="cg-field-group">
              <h4 className="cg-field-label">ASSOCIATIONS</h4>
              <div className="cg-pair-fields">
                <div className="cg-pair-field">
                  <label className="cg-pair-label">
                    THINGS WE ASSOCIATE WITH
                  </label>
                  <textarea
                    className="cg-textarea cg-textarea-warm"
                    placeholder="Premium materials, sustainability, craftsmanship..."
                    value={context.associations_with}
                    onChange={(e) =>
                      updateField("associations_with", e.target.value)
                    }
                    rows={3}
                  />
                </div>
                <div className="cg-pair-field">
                  <label className="cg-pair-label">
                    THINGS WE DON&apos;T ASSOCIATE WITH
                  </label>
                  <textarea
                    className="cg-textarea cg-textarea-warm"
                    placeholder="Fast fashion, plastic waste, dropshipping..."
                    value={context.associations_not}
                    onChange={(e) =>
                      updateField("associations_not", e.target.value)
                    }
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="cg-field-group">
              <h4 className="cg-field-label">BRAND GUIDELINES</h4>
              <textarea
                className="cg-textarea"
                placeholder="Describe your brand voice, tone, and overall guidelines..."
                value={context.brand_guidelines}
                onChange={(e) =>
                  updateField("brand_guidelines", e.target.value)
                }
                rows={5}
              />
            </div>
          </div>
        );

      case "products-usp":
        return (
          <div className="cg-section-content">
            <h3 className="cg-section-title">Products & USP</h3>
            <div className="cg-field-group">
              <h4 className="cg-field-label">FOCUS PRODUCTS</h4>
              <p className="cg-field-hint">
                Do you want to focus on any products for creative strategy?
              </p>
              <textarea
                className="cg-textarea cg-textarea-warm"
                placeholder="Product names (e.g. 'Wood Pizza Oven', 'Handmade Leather Wallet', 'Organic Coffee')"
                value={context.products}
                onChange={(e) => updateField("products", e.target.value)}
                rows={4}
              />
            </div>
            <div className="cg-field-group">
              <h4 className="cg-field-label">UNIQUE SELLING POINTS</h4>
              <p className="cg-field-hint">
                What do people buy from you and not competitors?
              </p>
              <textarea
                className="cg-textarea cg-textarea-warm"
                placeholder="We use the best ingredients and craftsmanship to make the most delicious pizza in the world."
                value={context.brand_guidelines}
                onChange={(e) =>
                  updateField("brand_guidelines", e.target.value)
                }
                rows={4}
              />
            </div>
          </div>
        );

      case "competitive":
        return (
          <div className="cg-section-content">
            <h3 className="cg-section-title">Competitive Landscape</h3>
            <div className="cg-field-group">
              <h4 className="cg-field-label">COMPETITIVE ANALYSIS</h4>
              <p className="cg-field-hint">
                Who are your main competitors and how do you differentiate?
              </p>
              <textarea
                className="cg-textarea"
                placeholder="Describe competitors, market positioning, and what sets you apart..."
                value={context.competitive_landscape}
                onChange={(e) =>
                  updateField("competitive_landscape", e.target.value)
                }
                rows={6}
              />
            </div>
          </div>
        );

      case "personas":
        return (
          <div className="cg-section-content">
            <h3 className="cg-section-title">Customer Personas</h3>
            <div className="cg-field-group">
              <h4 className="cg-field-label">TARGET AUDIENCE</h4>
              <p className="cg-field-hint">
                Describe your ideal customer profiles and demographics.
              </p>
              <textarea
                className="cg-textarea"
                placeholder="Age range, interests, pain points, buying behavior..."
                value={context.customer_personas}
                onChange={(e) =>
                  updateField("customer_personas", e.target.value)
                }
                rows={6}
              />
            </div>
          </div>
        );

      case "founder":
        return (
          <div className="cg-section-content">
            <h3 className="cg-section-title">Founder Story</h3>
            <div className="cg-field-group">
              <h4 className="cg-field-label">YOUR STORY</h4>
              <p className="cg-field-hint">
                Share the founding story — this helps generate authentic creative.
              </p>
              <textarea
                className="cg-textarea"
                placeholder="How and why was this brand started? What drives the mission?"
                value={context.founder_story}
                onChange={(e) => updateField("founder_story", e.target.value)}
                rows={6}
              />
            </div>
          </div>
        );

      case "marketing-cal":
        return (
          <div className="cg-section-content">
            <h3 className="cg-section-title">Marketing Calendar</h3>
            <div className="cg-field-group">
              <h4 className="cg-field-label">UPCOMING CAMPAIGNS & EVENTS</h4>
              <textarea
                className="cg-textarea"
                placeholder="Key dates, product launches, seasonal campaigns, sales events..."
                value={context.marketing_calendar}
                onChange={(e) =>
                  updateField("marketing_calendar", e.target.value)
                }
                rows={6}
              />
            </div>
          </div>
        );

      case "compliance":
        return (
          <div className="cg-section-content">
            <h3 className="cg-section-title">Compliance & Legal</h3>
            <div className="cg-field-group">
              <h4 className="cg-field-label">REGULATORY REQUIREMENTS</h4>
              <textarea
                className="cg-textarea"
                placeholder="Any disclaimers, legal requirements, or compliance rules for your ads..."
                value={context.compliance_legal}
                onChange={(e) =>
                  updateField("compliance_legal", e.target.value)
                }
                rows={6}
              />
            </div>
          </div>
        );

      case "testing":
        return (
          <div className="cg-section-content">
            <h3 className="cg-section-title">Testing Priorities</h3>
            <div className="cg-field-group">
              <h4 className="cg-field-label">WHAT TO TEST</h4>
              <textarea
                className="cg-textarea"
                placeholder="What creative angles, formats, or messages do you want to test?"
                value={context.testing_priorities}
                onChange={(e) =>
                  updateField("testing_priorities", e.target.value)
                }
                rows={6}
              />
            </div>
          </div>
        );

      case "creative-bg":
        return (
          <div className="cg-section-content">
            <h3 className="cg-section-title">Creative Background</h3>
            <div className="cg-field-group">
              <h4 className="cg-field-label">CREATIVE HISTORY</h4>
              <p className="cg-field-hint">
                What creative has worked well in the past? What hasn&apos;t?
              </p>
              <textarea
                className="cg-textarea"
                placeholder="Past campaigns, winning formats, styles that resonate..."
                value={context.creative_background}
                onChange={(e) =>
                  updateField("creative_background", e.target.value)
                }
                rows={6}
              />
            </div>
          </div>
        );

      case "ops-constraints":
        return (
          <div className="cg-section-content">
            <h3 className="cg-section-title">Creative Ops Constraints</h3>
            <div className="cg-field-group">
              <h4 className="cg-field-label">OPERATIONAL LIMITS</h4>
              <textarea
                className="cg-textarea"
                placeholder="Budget constraints, turnaround time, team capacity, format restrictions..."
                value={context.creative_ops_constraints}
                onChange={(e) =>
                  updateField("creative_ops_constraints", e.target.value)
                }
                rows={6}
              />
            </div>
          </div>
        );

      case "ad-account":
        return (
          <div className="cg-section-content">
            <h3 className="cg-section-title">Ad Account Details</h3>
            <div className="cg-field-group">
              <h4 className="cg-field-label">PLATFORMS & ACCOUNTS</h4>
              <textarea
                className="cg-textarea"
                placeholder="Which platforms do you advertise on? Any account-specific details..."
                value={context.ad_account_details}
                onChange={(e) =>
                  updateField("ad_account_details", e.target.value)
                }
                rows={6}
              />
            </div>
          </div>
        );

      case "goals":
        return (
          <div className="cg-section-content">
            <h3 className="cg-section-title">Creative Strategy Goals</h3>
            <div className="cg-field-group">
              <h4 className="cg-field-label">OBJECTIVES</h4>
              <textarea
                className="cg-textarea"
                placeholder="What are you trying to achieve with your creative? KPIs, goals, targets..."
                value={context.goals}
                onChange={(e) => updateField("goals", e.target.value)}
                rows={6}
              />
            </div>
          </div>
        );

      case "fonts-colors":
        return (
          <div className="cg-section-content">
            <h3 className="cg-section-title">Fonts & Colors</h3>

            <div className="cg-field-group">
              <h4 className="cg-field-label">FONTS</h4>
              <div className="cg-pair-fields">
                <div className="cg-pair-field">
                  <label className="cg-pair-label">Primary Font</label>
                  <input
                    type="text"
                    className="cg-input"
                    placeholder="e.g. Inter, Helvetica, Playfair Display"
                    value={context.font_primary}
                    onChange={(e) =>
                      updateField("font_primary", e.target.value)
                    }
                  />
                </div>
                <div className="cg-pair-field">
                  <label className="cg-pair-label">Secondary Font</label>
                  <input
                    type="text"
                    className="cg-input"
                    placeholder="e.g. Georgia, Roboto, Lato"
                    value={context.font_secondary}
                    onChange={(e) =>
                      updateField("font_secondary", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="cg-field-group">
              <h4 className="cg-field-label">COLORS</h4>
              <div className="cg-color-grid">
                <div className="cg-color-field">
                  <label className="cg-pair-label">Primary</label>
                  <div className="cg-color-input-wrap">
                    <input
                      type="color"
                      className="cg-color-picker"
                      value={context.color_primary}
                      onChange={(e) =>
                        updateField("color_primary", e.target.value)
                      }
                    />
                    <input
                      type="text"
                      className="cg-input cg-input-sm"
                      value={context.color_primary}
                      onChange={(e) =>
                        updateField("color_primary", e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="cg-color-field">
                  <label className="cg-pair-label">Secondary</label>
                  <div className="cg-color-input-wrap">
                    <input
                      type="color"
                      className="cg-color-picker"
                      value={context.color_secondary}
                      onChange={(e) =>
                        updateField("color_secondary", e.target.value)
                      }
                    />
                    <input
                      type="text"
                      className="cg-input cg-input-sm"
                      value={context.color_secondary}
                      onChange={(e) =>
                        updateField("color_secondary", e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="cg-color-field">
                  <label className="cg-pair-label">Accent</label>
                  <div className="cg-color-input-wrap">
                    <input
                      type="color"
                      className="cg-color-picker"
                      value={context.color_accent}
                      onChange={(e) =>
                        updateField("color_accent", e.target.value)
                      }
                    />
                    <input
                      type="text"
                      className="cg-input cg-input-sm"
                      value={context.color_accent}
                      onChange={(e) =>
                        updateField("color_accent", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  /* ── Main render ───────────────────────────────────────── */

  return (
    <div className="cg-page">
      {/* Header */}
      <div className="cg-header">
        <div>
          <h1 className="cg-title">Client Generator</h1>
          <p className="cg-subtitle">Help AdGen understand your brand</p>
        </div>
        <button
          className="cg-save-btn"
          onClick={saveContext}
          disabled={saving || !selectedClientId}
        >
          {saving ? "Saving..." : "Save Context"}
        </button>
      </div>

      {/* Client Selector */}
      <div className="cg-client-bar">
        <select
          className="cg-client-select"
          value={selectedClientId}
          onChange={(e) => setSelectedClientId(e.target.value)}
        >
          <option value="">Select a client...</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="cg-new-client">
          <input
            className="cg-input"
            placeholder="New client name"
            value={newClientName}
            onChange={(e) => setNewClientName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createClient()}
          />
          <button
            className="cg-add-btn"
            onClick={createClient}
            disabled={creatingClient || !newClientName.trim()}
          >
            {creatingClient ? "..." : "+ Add"}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {selectedClientId && (
        <div className="cg-progress-wrap">
          <div className="cg-progress-bar">
            <div
              className="cg-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="cg-progress-pct">{progress}%</span>
        </div>
      )}

      {/* Main Layout */}
      {selectedClientId ? (
        <div className="cg-layout">
          {/* Left Nav */}
          <div className="cg-nav">
            {SECTIONS.map((section) => (
              <div key={section.number} className="cg-nav-section">
                <div className="cg-nav-section-header">
                  <span className="cg-nav-number">{section.number}</span>
                  <div>
                    <div className="cg-nav-title">{section.title}</div>
                    <div className="cg-nav-subtitle">{section.subtitle}</div>
                  </div>
                </div>
                {section.items.map((item) => (
                  <button
                    key={item.key}
                    className={`cg-nav-item ${activeSection === item.key ? "cg-nav-item-active" : ""} ${isItemCompleted(item.key) ? "cg-nav-item-done" : ""}`}
                    onClick={() => setActiveSection(item.key)}
                  >
                    <span
                      className={`cg-nav-dot ${isItemCompleted(item.key) ? "cg-nav-dot-done" : ""}`}
                    />
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Right Content */}
          <div className="cg-content">{renderSectionContent()}</div>
        </div>
      ) : (
        <div className="cg-empty">
          <p>Select or create a client to get started.</p>
        </div>
      )}
    </div>
  );
}
