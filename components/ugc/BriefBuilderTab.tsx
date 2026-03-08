"use client";

import { useState, useEffect } from "react";
import type { UgcConcept } from "@/types/ugc";

export function BriefBuilderTab({
  concept,
  onUpdated,
}: {
  concept: UgcConcept | null;
  onUpdated: (updated?: UgcConcept) => void;
}) {
  const [form, setForm] = useState({
    title: "",
    hook_type: "",
    funnel_stage: "",
    tone: "",
    angle: "",
    persona: "",
    script_text: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (concept) {
      setForm({
        title: concept.title,
        hook_type: concept.hook_type ?? "",
        funnel_stage: concept.funnel_stage ?? "",
        tone: concept.tone ?? "",
        angle: concept.angle ?? "",
        persona: concept.persona ?? "",
        script_text: concept.script_text ?? "",
      });
    }
  }, [concept]);

  if (!concept) {
    return (
      <div className="ugc-empty-state">
        Select a concept from the Concepts tab to edit its brief.
      </div>
    );
  }

  const handleSave = async (newStatus?: string) => {
    setSaving(true);
    setMessage(null);
    try {
      const body: Record<string, unknown> = { ...form };
      if (newStatus) body.status = newStatus;

      const res = await fetch(`/api/ugc/concepts/${concept.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const json = await res.json();
        const label = newStatus === "approved" ? "Brief approved" : "Draft saved";
        setMessage({ type: "success", text: `${label} successfully!` });
        onUpdated(json.concept);
      } else {
        const json = await res.json().catch(() => ({}));
        setMessage({ type: "error", text: json.error || "Failed to save. Please try again." });
      }
    } catch (err) {
      console.error("Failed to update concept:", err);
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="ugc-section-header">
        <h3>Brief Builder</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="button button-secondary" onClick={() => handleSave("saved")} disabled={saving}>
            Save Draft
          </button>
          <button className="button button-primary" onClick={() => handleSave("approved")} disabled={saving}>
            Approve Brief
          </button>
        </div>
      </div>

      <div className="card">
        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <label className="form-label">Title</label>
            <input
              className="form-input"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <label className="form-label">Hook Type</label>
              <select className="form-select" value={form.hook_type} onChange={(e) => setForm((f) => ({ ...f, hook_type: e.target.value }))}>
                <option value="">Select...</option>
                <option value="question">Question</option>
                <option value="statistic">Statistic</option>
                <option value="bold-claim">Bold Claim</option>
                <option value="story">Story</option>
                <option value="shock">Shock</option>
              </select>
            </div>
            <div>
              <label className="form-label">Funnel Stage</label>
              <select className="form-select" value={form.funnel_stage} onChange={(e) => setForm((f) => ({ ...f, funnel_stage: e.target.value }))}>
                <option value="">Select...</option>
                <option value="awareness">Awareness</option>
                <option value="consideration">Consideration</option>
                <option value="conversion">Conversion</option>
                <option value="retention">Retention</option>
              </select>
            </div>
            <div>
              <label className="form-label">Tone</label>
              <input
                className="form-input"
                value={form.tone}
                onChange={(e) => setForm((f) => ({ ...f, tone: e.target.value }))}
                placeholder="e.g., energetic, professional"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="form-label">Angle</label>
              <input
                className="form-input"
                value={form.angle}
                onChange={(e) => setForm((f) => ({ ...f, angle: e.target.value }))}
                placeholder="e.g., testimonial, demo, unboxing"
              />
            </div>
            <div>
              <label className="form-label">Persona</label>
              <input
                className="form-input"
                value={form.persona}
                onChange={(e) => setForm((f) => ({ ...f, persona: e.target.value }))}
                placeholder="e.g., fitness mom, tech enthusiast"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Script</label>
            <textarea
              className="form-input"
              rows={8}
              value={form.script_text}
              onChange={(e) => setForm((f) => ({ ...f, script_text: e.target.value }))}
              placeholder="Write the full script here..."
            />
          </div>
        </div>
      </div>

      {message && (
        <div
          style={{
            marginTop: 16,
            padding: "12px 16px",
            borderRadius: 8,
            background: message.type === "success" ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
            border: `1px solid ${message.type === "success" ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
            color: message.type === "success" ? "#22c55e" : "#ef4444",
            fontSize: "0.9rem",
          }}
        >
          {message.text}
        </div>
      )}

      <div className="status-workflow" style={{ marginTop: 16 }}>
        <span className="text-muted">Current status: </span>
        <span className="status-badge">{concept.status}</span>
      </div>
    </div>
  );
}
