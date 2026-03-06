"use client";

import type { Client, Profile, PromptPack, ReferenceImage } from "@/types/domain";
import { validateBatchCreate } from "@/lib/validation/batch";

interface StepReviewProps {
  client: Client | undefined;
  mode: "image" | "video" | null;
  profile: Profile | undefined;
  promptPack: PromptPack | undefined;
  references: ReferenceImage[];
  onLaunch: () => Promise<void>;
  launching: boolean;
}

export function StepReview({
  client,
  mode,
  profile,
  promptPack,
  references,
  onLaunch,
  launching,
}: StepReviewProps) {
  // Validate
  const validation = validateBatchCreate({
    clientId: client?.id ?? null,
    profileId: profile?.id ?? null,
    promptPackId: promptPack?.id ?? null,
    promptItemCount: promptPack?.item_count ?? 0,
    hasReferenceImage: references.length > 0,
    profileMode: mode ?? undefined,
    audioEnabled: profile?.audio_enabled ?? false,
  });

  const hasPrimaryIdentity = references.some(
    (r) => r.label === "identity" && r.is_primary
  );

  return (
    <div className="wizard-step">
      <div className="step-header">
        <h2>Review & Launch</h2>
        <p>Verify your batch run configuration before launching.</p>
      </div>

      <div className="review-summary">
        <div className="summary-card">
          <h3>Batch Configuration</h3>
          <div className="summary-row">
            <span className="summary-label">Client:</span>
            <span className="summary-value">{client?.name || "-"}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Mode:</span>
            <span className="summary-value">
              {mode ? mode.charAt(0).toUpperCase() + mode.slice(1) : "-"}
            </span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Profile:</span>
            <span className="summary-value">{profile?.name || "-"}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Prompt Pack:</span>
            <span className="summary-value">{promptPack?.name || "-"}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Total Items:</span>
            <span className="summary-value">{promptPack?.item_count || 0}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">References:</span>
            <span className="summary-value">{references.length} selected</span>
          </div>
        </div>

        {references.length > 0 && (
          <div className="summary-card">
            <h3>Selected References</h3>
            <div className="reference-preview">
              {references.map((ref) => (
                <div key={ref.id} className="preview-thumb">
                  <img src={ref.url} alt={ref.label} />
                  <div className="thumb-label">{ref.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {validation.errors.length > 0 && (
          <div className="summary-card warning-card error-card">
            <h3>❌ Issues Blocking Launch</h3>
            <ul className="issue-list">
              {validation.errors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {validation.warnings.length > 0 && (
          <div className="summary-card warning-card">
            <h3>⚠️ Warnings</h3>
            <ul className="issue-list">
              {validation.warnings.map((warn, idx) => (
                <li key={idx}>{warn}</li>
              ))}
            </ul>
          </div>
        )}

        {!hasPrimaryIdentity && (
          <div className="summary-card warning-card error-card">
            <h3>❌ Missing Primary Identity</h3>
            <p>At least one primary identity image is required to launch.</p>
          </div>
        )}

        {validation.valid && hasPrimaryIdentity && (
          <div className="summary-card success-card">
            <h3>✓ Ready to Launch</h3>
            <p>All requirements are met. You can now launch this batch run.</p>
          </div>
        )}
      </div>
    </div>
  );
}
