"use client";

import { useState } from "react";
import type { UgcVariant } from "@/types/ugc";

export function DistributionTab({
  variants,
  onDistributed,
}: {
  variants: UgcVariant[];
  onDistributed: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [distributing, setDistributing] = useState(false);
  const [results, setResults] = useState<Array<{ id: string; distributed: boolean; error?: string }>>([]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDistribute = async () => {
    if (selected.size === 0) return;
    setDistributing(true);
    try {
      const res = await fetch("/api/ugc/distribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variant_ids: Array.from(selected) }),
      });
      const json = await res.json();
      setResults(json.results ?? []);
      setSelected(new Set());
      onDistributed();
    } catch (err) {
      console.error("Distribution failed:", err);
    } finally {
      setDistributing(false);
    }
  };

  return (
    <div>
      <div className="ugc-section-header">
        <h3>Distribution ({variants.length} approved)</h3>
        <button
          className="button button-primary"
          onClick={handleDistribute}
          disabled={distributing || selected.size === 0}
        >
          {distributing ? "Distributing..." : `Distribute (${selected.size})`}
        </button>
      </div>

      {results.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h4 style={{ marginBottom: 8 }}>Distribution Results</h4>
          {results.map((r) => (
            <div key={r.id} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
              <span>{r.distributed ? "✓" : "✗"}</span>
              <span className="text-muted">{r.id.slice(0, 8)}...</span>
              {r.error && <span style={{ color: "var(--color-error)" }}>{r.error}</span>}
            </div>
          ))}
        </div>
      )}

      {variants.length === 0 ? (
        <div className="ugc-empty-state">No approved variants ready for distribution.</div>
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
              <div className="approval-card-info">
                <p className="variant-card-prompt">{v.prompt.slice(0, 80)}</p>
                <div className="variant-card-meta">
                  <span>{v.kind}</span>
                  {v.aspect_ratio && <span>{v.aspect_ratio}</span>}
                  <span className="status-badge" style={{ backgroundColor: "var(--color-success)" }}>approved</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
