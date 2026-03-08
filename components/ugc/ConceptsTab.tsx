"use client";

import { useState } from "react";
import type { UgcConcept } from "@/types/ugc";
import { ConceptCard } from "./ConceptCard";

const STATUS_FILTERS = ["all", "drafted", "saved", "approved", "launched", "rejected"];
const FUNNEL_FILTERS = ["all", "awareness", "consideration", "conversion", "retention"];

export function ConceptsTab({
  brandId,
  concepts,
  loading,
  onSelect,
  onCreated,
}: {
  brandId: string;
  concepts: UgcConcept[];
  loading: boolean;
  onSelect: (c: UgcConcept) => void;
  onCreated: () => void;
}) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [funnelFilter, setFunnelFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [hookType, setHookType] = useState("");
  const [funnelStage, setFunnelStage] = useState("");
  const [creating, setCreating] = useState(false);

  const filtered = concepts.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (funnelFilter !== "all" && c.funnel_stage !== funnelFilter) return false;
    return true;
  });

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/ugc/concepts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_id: brandId,
          title: title.trim(),
          hook_type: hookType || undefined,
          funnel_stage: funnelStage || undefined,
        }),
      });
      if (res.ok) {
        setTitle("");
        setHookType("");
        setFunnelStage("");
        setShowCreate(false);
        onCreated();
      }
    } catch (err) {
      console.error("Failed to create concept:", err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="ugc-section-header">
        <h3>Concepts</h3>
        <button className="button button-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Cancel" : "+ New Concept"}
        </button>
      </div>

      {showCreate && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label className="form-label">Title</label>
              <input
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Summer Sale Hook Video"
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label className="form-label">Hook Type</label>
                <select className="form-select" value={hookType} onChange={(e) => setHookType(e.target.value)}>
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
                <select className="form-select" value={funnelStage} onChange={(e) => setFunnelStage(e.target.value)}>
                  <option value="">Select...</option>
                  <option value="awareness">Awareness</option>
                  <option value="consideration">Consideration</option>
                  <option value="conversion">Conversion</option>
                  <option value="retention">Retention</option>
                </select>
              </div>
            </div>
            <button className="button button-primary" onClick={handleCreate} disabled={creating || !title.trim()}>
              {creating ? "Creating..." : "Create Concept"}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <select className="form-select" style={{ width: "auto" }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>{s === "all" ? "All Statuses" : s}</option>
          ))}
        </select>
        <select className="form-select" style={{ width: "auto" }} value={funnelFilter} onChange={(e) => setFunnelFilter(e.target.value)}>
          {FUNNEL_FILTERS.map((f) => (
            <option key={f} value={f}>{f === "all" ? "All Funnels" : f}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="ugc-empty-state">Loading concepts...</div>
      ) : filtered.length === 0 ? (
        <div className="ugc-empty-state">
          No concepts yet. Create your first concept to get started.
        </div>
      ) : (
        <div className="concept-grid">
          {filtered.map((c) => (
            <ConceptCard key={c.id} concept={c} onClick={() => onSelect(c)} />
          ))}
        </div>
      )}
    </div>
  );
}
