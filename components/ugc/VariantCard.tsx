"use client";

import { useState } from "react";
import type { UgcVariant } from "@/types/ugc";

const STATUS_COLORS: Record<string, string> = {
  queued: "var(--color-status-queued)",
  generating: "var(--color-status-processing)",
  generated: "var(--color-success)",
  approved: "var(--color-info)",
  rejected: "var(--color-error)",
  launched: "var(--color-status-stopped)",
  failed: "var(--color-error)",
};

export function VariantCard({
  variant,
  onPreview,
}: {
  variant: UgcVariant;
  onPreview: () => void;
}) {
  const [favorited, setFavorited] = useState(false);

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/ugc/variants/${variant.id}/favorite`, { method: "POST" });
      setFavorited(!favorited);
    } catch {
      // ignore
    }
  };

  return (
    <div className="variant-card" onClick={onPreview}>
      <div className="variant-card-preview">
        {variant.output_url ? (
          variant.kind === "video" ? (
            <div className="variant-video-thumb">
              <span>▶</span>
            </div>
          ) : (
            <img src={variant.output_url} alt="Variant" />
          )
        ) : (
          <div className="variant-placeholder">
            {variant.status === "generating" ? "Generating..." : variant.status === "failed" ? "Failed" : "Pending"}
          </div>
        )}
      </div>
      <div className="variant-card-info">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span
            className="status-badge"
            style={{ backgroundColor: STATUS_COLORS[variant.status] ?? "var(--color-status-queued)", fontSize: "0.7rem" }}
          >
            {variant.status}
          </span>
          <button
            className="variant-favorite"
            onClick={handleFavorite}
            title="Toggle favorite"
          >
            {favorited ? "♥" : "♡"}
          </button>
        </div>
        <p className="variant-card-prompt">
          {variant.prompt.slice(0, 60)}{variant.prompt.length > 60 ? "..." : ""}
        </p>
        <div className="variant-card-meta">
          <span>{variant.kind}</span>
          {variant.duration_sec && <span>{variant.duration_sec}s</span>}
          {variant.aspect_ratio && <span>{variant.aspect_ratio}</span>}
          {variant.client_charge_usd != null && <span>${Number(variant.client_charge_usd).toFixed(2)}</span>}
        </div>
      </div>
    </div>
  );
}
