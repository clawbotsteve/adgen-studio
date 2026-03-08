"use client";

import Link from "next/link";
import type { PromptPack } from "@/types/domain";

interface StepPromptPackProps {
  promptPacks: PromptPack[];
  selected: string | null;
  onSelect: (packId: string) => void;
}

export function StepPromptPack({ promptPacks, selected, onSelect }: StepPromptPackProps) {
  if (promptPacks.length === 0) {
    return (
      <div className="bw-step">
        <div className="bw-step-header">
          <h2 className="bw-step-title">Select Prompt Pack</h2>
          <p className="bw-step-desc">Choose a prompt pack to drive the batch generation.</p>
        </div>
        <div className="bw-empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
          <p>No prompt packs found.</p>
          <Link href="/prompt-packs" className="bw-btn bw-btn-secondary">Create Prompt Pack</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bw-step">
      <div className="bw-step-header">
        <h2 className="bw-step-title">Select Prompt Pack</h2>
        <p className="bw-step-desc">Choose a prompt pack to drive the batch generation.</p>
      </div>

      <div className="bw-card-grid bw-card-grid-2">
        {promptPacks.map((pack) => (
          <button
            key={pack.id}
            className={`bw-select-card bw-pack-card ${selected === pack.id ? "bw-selected" : ""}`}
            onClick={() => onSelect(pack.id)}
          >
            <div className="bw-card-info" style={{ width: "100%" }}>
              <div className="bw-pack-top">
                <span className="bw-card-name">{pack.name}</span>
                <span className="bw-pack-count">{pack.item_count} items</span>
              </div>
              {pack.description && (
                <span className="bw-card-desc">{pack.description}</span>
              )}
              {pack.tags && pack.tags.length > 0 && (
                <div className="bw-tag-list">
                  {pack.tags.map((tag) => (
                    <span key={tag} className="bw-tag">{tag}</span>
                  ))}
                </div>
              )}
            </div>
            {selected === pack.id && (
              <div className="bw-card-check">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
