"use client";

import type { UgcConcept } from "@/types/ugc";

const STATUS_COLORS: Record<string, string> = {
  drafted: "var(--color-status-queued)",
  saved: "var(--color-info)",
  approved: "var(--color-success)",
  launched: "var(--color-status-stopped)",
  rejected: "var(--color-error)",
};

export function ConceptCard({
  concept,
  onClick,
}: {
  concept: UgcConcept;
  onClick: () => void;
}) {
  return (
    <div className="concept-card" onClick={onClick}>
      <div className="concept-card-header">
        <h4 className="concept-card-title">{concept.title}</h4>
        <span
          className="status-badge"
          style={{ backgroundColor: STATUS_COLORS[concept.status] ?? "var(--color-status-queued)" }}
        >
          {concept.status}
        </span>
      </div>
      <div className="concept-card-meta">
        {concept.hook_type && <span className="concept-tag">{concept.hook_type}</span>}
        {concept.funnel_stage && <span className="concept-tag">{concept.funnel_stage}</span>}
        {concept.tone && <span className="concept-tag">{concept.tone}</span>}
      </div>
      {concept.script_text && (
        <p className="concept-card-script">
          {concept.script_text.slice(0, 120)}{concept.script_text.length > 120 ? "..." : ""}
        </p>
      )}
      <div className="concept-card-footer">
        <span className="text-muted">
          {new Date(concept.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
