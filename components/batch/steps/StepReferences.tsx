"use client";

import Link from "next/link";
import type { ReferenceImage } from "@/types/domain";

interface StepReferencesProps {
  references: ReferenceImage[];
  selected: string[];
  onSelect: (refIds: string[]) => void;
}

export function StepReferences({
  references,
  selected,
  onSelect,
}: StepReferencesProps) {
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

  if (references.length === 0) {
    return (
      <div className="wizard-step">
        <div className="step-header">
          <h2>Select Reference Images</h2>
          <p>Choose reference images for this batch run.</p>
        </div>
        <div className="step-warning">
          <p>No reference images found for this client.</p>
          <Link href="/references" className="button button-secondary">
            Upload References
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="wizard-step">
      <div className="step-header">
        <h2>Select Reference Images</h2>
        <p>Choose reference images for this batch run.</p>
      </div>

      {!hasPrimaryIdentity && (
        <div className="step-block-warning">
          <strong>⚠️ Missing Primary Identity</strong>
          <p>
            You must have at least one primary identity image. Please upload one
            before proceeding.
          </p>
          <Link href="/references" className="button button-secondary">
            Upload Primary Identity
          </Link>
        </div>
      )}

      <div className="step-references">
        {references.map((ref) => (
          <div
            key={ref.id}
            className={`reference-card ${
              selected.includes(ref.id) ? "selected" : ""
            } ${!hasPrimaryIdentity ? "disabled" : ""}`}
            onClick={() => {
              if (hasPrimaryIdentity) {
                handleToggle(ref.id);
              }
            }}
          >
            <div className="reference-image">
              <img src={ref.url} alt={ref.label} />
              {ref.is_primary && (
                <span className="badge-primary">Primary</span>
              )}
            </div>
            <div className="reference-info">
              <div className="reference-label">{ref.label}</div>
              {ref.tags && ref.tags.length > 0 && (
                <div className="reference-tags">
                  {ref.tags.map((tag) => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              )}
            </div>
            {selected.includes(ref.id) && (
              <div className="checkmark">✓</div>
            )}
          </div>
        ))}
      </div>

      {selected.length === 0 && hasPrimaryIdentity && (
        <div className="step-info">
          <p>At least select the primary identity image to proceed.</p>
        </div>
      )}
    </div>
  );
}
