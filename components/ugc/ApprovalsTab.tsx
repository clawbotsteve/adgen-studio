"use client";

import { useState } from "react";
import type { UgcVariant } from "@/types/ugc";

export function ApprovalsTab({
  variants,
  onDone,
}: {
  variants: UgcVariant[];
  onDone: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === variants.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(variants.map((v) => v.id)));
    }
  };

  const handleBulkAction = async (status: "approved" | "rejected") => {
    if (selected.size === 0) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/ugc/approve-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variant_ids: Array.from(selected),
          status,
        }),
      });
      if (res.ok) {
        setSelected(new Set());
        onDone();
      }
    } catch (err) {
      console.error("Bulk action failed:", err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      <div className="ugc-section-header">
        <h3>Approvals ({variants.length} pending)</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="button button-secondary" onClick={toggleAll}>
            {selected.size === variants.length ? "Deselect All" : "Select All"}
          </button>
          <button
            className="button button-primary"
            onClick={() => handleBulkAction("approved")}
            disabled={processing || selected.size === 0}
          >
            Approve ({selected.size})
          </button>
          <button
            className="button button-danger"
            onClick={() => handleBulkAction("rejected")}
            disabled={processing || selected.size === 0}
          >
            Reject ({selected.size})
          </button>
        </div>
      </div>

      {variants.length === 0 ? (
        <div className="ugc-empty-state">No variants pending approval.</div>
      ) : (
        <div className="approval-grid">
          {variants.map((v) => (
            <div
              key={v.id}
              className={`approval-card ${selected.has(v.id) ? "selected" : ""}`}
              onClick={() => toggleSelect(v.id)}
            >
              <div className="approval-card-checkbox">
                <input
                  type="checkbox"
                  checked={selected.has(v.id)}
                  onChange={() => toggleSelect(v.id)}
                />
              </div>
              <div className="approval-card-preview">
                {v.output_url ? (
                  v.kind === "video" ? (
                    <video src={v.output_url} style={{ width: "100%", borderRadius: 6 }} />
                  ) : (
                    <img src={v.output_url} alt="Variant" style={{ width: "100%", borderRadius: 6 }} />
                  )
                ) : (
                  <div className="variant-placeholder">No preview</div>
                )}
              </div>
              <div className="approval-card-info">
                <p className="variant-card-prompt">{v.prompt.slice(0, 80)}{v.prompt.length > 80 ? "..." : ""}</p>
                <div className="variant-card-meta">
                  <span>{v.kind}</span>
                  {v.duration_sec && <span>{v.duration_sec}s</span>}
                  {v.aspect_ratio && <span>{v.aspect_ratio}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
