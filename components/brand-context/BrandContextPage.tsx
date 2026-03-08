"use client";

import { useState, useEffect, useCallback } from "react";
import type { Client, BrandContext, BrandContextDoc } from "@/types/domain";
import { ContextDocUploader } from "./ContextDocUploader";

const BRAND_FIELDS: { key: keyof BrandContext; label: string; placeholder: string }[] = [
  { key: "brand_guidelines", label: "Brand Guidelines", placeholder: "Positioning, vocabulary, tone, voice, do's and don'ts..." },
  { key: "products", label: "Products & USPs", placeholder: "Product descriptions, unique selling propositions, key features..." },
  { key: "competitive_landscape", label: "Competitive Landscape", placeholder: "Key competitors, market positioning, differentiators..." },
  { key: "customer_personas", label: "Customer Personas", placeholder: "Target audience profiles, demographics, psychographics, pain points..." },
  { key: "founder_story", label: "Founder Story", placeholder: "Brand origin story, founder background, mission..." },
  { key: "marketing_calendar", label: "Marketing Calendar", placeholder: "Upcoming campaigns, seasonal events, key dates..." },
  { key: "compliance_legal", label: "Compliance & Legal", placeholder: "Restricted claims, required disclaimers, regulatory notes..." },
  { key: "testing_priorities", label: "Testing Priorities", placeholder: "What to test next, iteration vs new concepts, hypotheses..." },
  { key: "ad_format_preferences", label: "Ad Format Preferences", placeholder: "Preferred formats, platform specs, creative constraints..." },
  { key: "creative_ops_constraints", label: "Creative Ops Constraints", placeholder: "Turnaround times, volume targets, operational limits..." },
  { key: "naming_conventions", label: "Naming Conventions", placeholder: "Campaign naming rules, asset naming patterns..." },
  { key: "goals", label: "Goals", placeholder: "Business goals, marketing KPIs, growth targets..." },
];

export function BrandContextPage({ clients }: { clients: Client[] }) {
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [context, setContext] = useState<BrandContext | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [docs, setDocs] = useState<BrandContextDoc[]>([]);

  const fetchContext = useCallback(async (cid: string) => {
    setLoading(true);
    setSaveStatus("idle");
    try {
      const res = await fetch(`/api/brand-context?clientId=${cid}`);
      const data = await res.json();
      const ctx = data.context as BrandContext | null;
      setContext(ctx);

      // Populate form data
      const fd: Record<string, string> = {};
      for (const field of BRAND_FIELDS) {
        fd[field.key] = (ctx?.[field.key] as string) ?? "";
      }
      setFormData(fd);

      // Fetch docs if context exists
      if (ctx) {
        const docsRes = await fetch(`/api/brand-context/docs?brandContextId=${ctx.id}`);
        const docsData = await docsRes.json();
        setDocs(docsData.docs ?? []);
      } else {
        setDocs([]);
      }
    } catch {
      console.error("Failed to fetch brand context");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (clientId) fetchContext(clientId);
  }, [clientId, fetchContext]);

  const handleSave = async () => {
    if (!clientId) return;
    setSaving(true);
    setSaveStatus("idle");
    try {
      const res = await fetch("/api/brand-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, ...formData }),
      });
      if (res.ok) {
        const data = await res.json();
        setContext(data.context);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        setSaveStatus("error");
      }
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setSaveStatus("idle");
  };

  const handleDocUploaded = () => {
    if (clientId) fetchContext(clientId);
  };

  const handleDeleteDoc = async (docId: string) => {
    try {
      const res = await fetch(`/api/brand-context/docs/${docId}`, { method: "DELETE" });
      if (res.ok) {
        setDocs((prev) => prev.filter((d) => d.id !== docId));
      }
    } catch {
      console.error("Failed to delete document");
    }
  };

  const filledCount = BRAND_FIELDS.filter(
    (f) => formData[f.key]?.trim()
  ).length;

  if (clients.length === 0) {
    return (
      <div className="card">
        <p style={{ color: "var(--color-text-secondary)" }}>
          No clients found. Create a client first under Manage → Clients.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Client Selector */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <label className="form-label">Select Client</label>
            <select
              className="form-select"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="bc-status-badge">
            <span className={`bc-status-dot ${filledCount > 0 ? "bc-status-active" : ""}`} />
            {filledCount} / {BRAND_FIELDS.length} fields filled
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <p style={{ color: "var(--color-text-secondary)" }}>Loading brand context...</p>
        </div>
      ) : (
        <>
          {/* Brand Context Fields */}
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Context Fields</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {saveStatus === "saved" && (
                  <span style={{ color: "var(--color-success)", fontSize: 13 }}>Saved successfully</span>
                )}
                {saveStatus === "error" && (
                  <span style={{ color: "var(--color-error)", fontSize: 13 }}>Failed to save</span>
                )}
                <button
                  className="button button-primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Context"}
                </button>
              </div>
            </div>

            <div className="bc-fields-grid">
              {BRAND_FIELDS.map((field) => (
                <div key={field.key} className="bc-field">
                  <label className="form-label">{field.label}</label>
                  <textarea
                    className="form-input bc-textarea"
                    rows={4}
                    value={formData[field.key] ?? ""}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
              <button
                className="button button-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Context"}
              </button>
            </div>
          </div>

          {/* Document Upload */}
          <div className="card">
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Brand Documents</h3>
            <p style={{ color: "var(--color-text-secondary)", fontSize: 13, marginBottom: 16 }}>
              Upload brand guidelines PDFs, style guides, briefs, and other reference documents.
            </p>

            {context ? (
              <ContextDocUploader
                brandContextId={context.id}
                clientId={clientId}
                docs={docs}
                onUploaded={handleDocUploaded}
                onDelete={handleDeleteDoc}
              />
            ) : (
              <p style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>
                Save context fields first to enable document uploads.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
