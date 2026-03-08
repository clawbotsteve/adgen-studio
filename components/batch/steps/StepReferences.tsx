"use client";

import Link from "next/link";
import type { ReferenceImage } from "@/types/domain";

interface StepReferencesProps {
  references: ReferenceImage[];
  selected: string[];
  onSelect: (refIds: string[]) => void;
}

export function StepReferences({ references, selected, onSelect }: StepReferencesProps) {
  const hasPrimaryIdentity = references.some(
    (r) => r.label === "identity" && r.is_primary
  );

  const handleToggle = (refId: string) => {
    if (selected.includes(refId)) {
      onSelect(selected.filter((id) => id !== refId));
    } else {
      onSelect([...selected, refId]);
    }
  };

  const selectAll = () => onSelect(references.map((r) => r.id));
  const clearAll = () => onSelect([]);

  if (references.length === 0) {
    return (
      <div className="bw-step">
        <div className="bw-step-header">
          <h2 className="bw-step-title">Select Reference Images</h2>
          <p className="bw-step-desc">Choose the reference images for this batch run.</p>
        </div>
        <div className="bw-empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><circle cx="12" cy="13" r="3"/></svg>
          <p>No reference images found for this client.</p>
          <Link href="/references" className="bw-btn bw-btn-secondary">Upload References</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bw-step">
      <div className="bw-step-header">
        <h2 className="bw-step-title">Select Reference Images</h2>
        <p className="bw-step-desc">Choose the reference images for this batch run.</p>
      </div>

      {!hasPrimaryIdentity && (
        <div className="bw-alert bw-alert-error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div>
            <strong>Missing Primary Identity</strong>
            <p>You need at least one primary identity image before proceeding.</p>
          </div>
          <Link href="/references" className="bw-btn bw-btn-secondary" style={{ marginLeft: "auto", whiteSpace: "nowrap" }}>Upload</Link>
        </div>
      )}

      {hasPrimaryIdentity && references.length > 1 && (
        <div className="bw-ref-toolbar">
          <span className="bw-ref-count">{selected.length} of {references.length} selected</span>
          <div className="bw-ref-actions">
            <button className="bw-btn-text" onClick={selectAll}>Select All</button>
            <button className="bw-btn-text" onClick={clearAll}>Clear</button>
          </div>
        </div>
      )}

      <div className="bw-ref-grid">
        {references.map((ref) => {
          const isSelected = selected.includes(ref.id);
          return (
            <button
              key={ref.id}
              className={`bw-ref-card ${isSelected ? "bw-selected" : ""} ${!hasPrimaryIdentity ? "bw-disabled" : ""}`}
              onClick={() => hasPrimaryIdentity && handleToggle(ref.id)}
              disabled={!hasPrimaryIdentity}
            >
              <div className="bw-ref-img-wrap">
                <img src={ref.url} alt={ref.label} className="bw-ref-img" />
                {ref.is_primary && <span className="bw-ref-primary">Primary</span>}
                {isSelected && (
                  <div className="bw-ref-check">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                )}
              </div>
              <div className="bw-ref-info">
                <span className="bw-ref-label">{ref.label}</span>
                {ref.tags && ref.tags.length > 0 && (
                  <div className="bw-tag-list">
                    {ref.tags.map((tag) => (
                      <span key={tag} className="bw-tag bw-tag-sm">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selected.length === 0 && hasPrimaryIdentity && (
        <div className="bw-alert bw-alert-info">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <p>Select at least the primary identity image to proceed.</p>
        </div>
      )}
    </div>
  );
}
