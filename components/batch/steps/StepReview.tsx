"use client";

import type { Client, Profile, PromptPack, ReferenceImage } from "@/types/domain";

interface StepReviewProps {
  client: Client | undefined;
  mode: "image" | "video" | null;
  profile: Profile | undefined;
  promptPack: PromptPack | undefined;
  references: ReferenceImage[];
  quantity: number;
  onQuantityChange: (q: number) => void;
  onLaunch: () => Promise<void>;
  launching: boolean;
}

export function StepReview({
  client,
  mode,
  profile,
  promptPack,
  references,
  quantity,
  onQuantityChange,
  onLaunch,
  launching,
}: StepReviewProps) {
  const canLaunch = !!(client && profile && promptPack);

  const configItems = [
    { label: "Client", value: client?.name, icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
    { label: "Mode", value: mode ? mode.charAt(0).toUpperCase() + mode.slice(1) : "-", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { label: "Profile", value: profile?.name, icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" },
    { label: "Prompt Pack", value: promptPack?.name, icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
    { label: "Quantity", value: `${Math.min(quantity, promptPack?.item_count ?? quantity)} of ${promptPack?.item_count ?? 0} items`, icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
    { label: "References", value: references.length > 0 ? `${references.length} selected` : "None (text-to-image)", icon: "M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" },
  ];

  return (
    <div className="bw-step">
      <div className="bw-step-header">
        <h2 className="bw-step-title">Review & Launch</h2>
        <p className="bw-step-desc">Verify your batch configuration before launching.</p>
      </div>

      <div className="bw-review-grid">
        {configItems.map((item) => (
          <div key={item.label} className="bw-review-item">
            <div className="bw-review-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon}/></svg>
            </div>
            <div className="bw-review-detail">
              <span className="bw-review-label">{item.label}</span>
              <span className="bw-review-value">{item.value || "-"}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, padding: "16px 0", borderTop: "1px solid var(--color-border, #333)" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "var(--color-text-secondary)" }}>Generation Quantity</h3>
        <select
          className="form-select"
          value={quantity}
          onChange={(e) => onQuantityChange(Number(e.target.value))}
          style={{ width: 200 }}
        >
          <option value={5}>5 items</option>
          <option value={15}>15 items</option>
          <option value={30}>30 items</option>
          <option value={50}>50 items</option>
        </select>
        <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 4 }}>
          Will generate up to {Math.min(quantity, promptPack?.item_count ?? quantity)} items from the prompt pack.
        </p>
      </div>

      {references.length > 0 && (
        <div className="bw-review-refs">
          <h3 className="bw-review-section-title">Selected References</h3>
          <div className="bw-review-thumbs">
            {references.map((ref) => (
              <div key={ref.id} className="bw-review-thumb">
                <img src={ref.url} alt={ref.label} />
                <span className="bw-thumb-label">{ref.label}</span>
                {ref.is_primary && <span className="bw-thumb-primary">Primary</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {canLaunch && (
        <div className="bw-alert bw-alert-success">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <div>
            <strong>Ready to Launch</strong>
            <p>All requirements are met. You can now launch this batch run.</p>
          </div>
        </div>
      )}
    </div>
  );
}
