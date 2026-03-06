"use client";

import Link from "next/link";
import type { PromptPack } from "@/types/domain";

interface StepPromptPackProps {
  promptPacks: PromptPack[];
  selected: string | null;
  onSelect: (packId: string) => void;
}

export function StepPromptPack({
  promptPacks,
  selected,
  onSelect,
}: StepPromptPackProps) {
  if (promptPacks.length === 0) {
    return (
      <div className="wizard-step">
        <div className="step-header">
          <h2>Select Prompt Pack</h2>
          <p>Choose a prompt pack to run.</p>
        </div>
        <div className="step-empty">
          <p>No prompt packs found.</p>
          <Link href="/prompt-packs" className="button button-secondary">
            Create Prompt Pack
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="wizard-step">
      <div className="step-header">
        <h2>Select Prompt Pack</h2>
        <p>Choose a prompt pack to run.</p>
      </div>

      <div className="step-packs">
        {promptPacks.map((pack) => (
          <div
            key={pack.id}
            className={`pack-card ${selected === pack.id ? "selected" : ""}`}
            onClick={() => onSelect(pack.id)}
          >
            <div className="pack-header">
              <h3>{pack.name}</h3>
              <span className="pack-count">{pack.item_count} items</span>
            </div>
            {pack.description && (
              <div className="pack-description">{pack.description}</div>
            )}
            {pack.tags && pack.tags.length > 0 && (
              <div className="pack-tags">
                {pack.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
