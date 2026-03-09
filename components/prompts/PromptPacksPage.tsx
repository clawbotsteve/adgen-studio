"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/hooks/useToast";
import { PROMPT_TEMPLATES } from "@/lib/constants/promptTemplates";
import { TemplatePreviewModal } from "./TemplatePreviewModal";
import type { PromptPack } from "@/types/domain";
import type { PromptTemplate } from "@/lib/constants/promptTemplates";

interface PromptPacksPageProps {
  packs: PromptPack[];
}

export function PromptPacksPage({ packs }: PromptPacksPageProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [selectedTemplate, setSelectedTemplate] =
    useState<PromptTemplate | null>(null);
  const [customName, setCustomName] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) {
      addToast("Pack name is required", "error");
      return;
    }
    setIsCreating(true);
    try {
      const res = await fetch("/api/prompt-packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customName.trim(),
          description: customDesc.trim() || undefined,
          tags: [],
        }),
      });
      if (!res.ok) {
        addToast("Failed to create prompt pack", "error");
        return;
      }
      const data = await res.json();
      addToast("Prompt pack created", "success");
      setCustomName("");
      setCustomDesc("");
      router.push(`/prompt-packs/${data.pack.id}`);
      router.refresh();
    } catch {
      addToast("An error occurred", "error");
    } finally {
      setIsCreating(false);
    }
  };

  // Icon color map for template cards
  const iconColors: Record<string, string> = {
    product_photography: "#818cf8",
    background_scene: "#34d399",
    ugc_style: "#f472b6",
    fashion_apparel: "#a78bfa",
    food_beverage: "#fbbf24",
  };

  return (
    <>
      {/* ─── Start from a Template ─── */}
      <section className="pp-section">
        <div className="pp-section-header">
          <div className="pp-section-header-text">
            <h2 className="pp-section-title">Start from a Template</h2>
            <p className="pp-section-subtitle">
              Choose a pre-built prompt pack to get started quickly
            </p>
          </div>
        </div>

        <div className="pp-templates-grid">
          {PROMPT_TEMPLATES.map((template) => (
            <button
              key={template.id}
              className="pp-template-card"
              onClick={() => setSelectedTemplate(template)}
            >
              <div
                className="pp-template-icon"
                style={{ background: template.color }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={iconColors[template.id] || "currentColor"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={template.icon} />
                </svg>
              </div>
              <div className="pp-template-info">
                <h3 className="pp-template-name">{template.name}</h3>
                <span className="pp-template-count">
                  {template.items.length} prompts
                </span>
              </div>
              <p className="pp-template-desc">{template.description}</p>
              <div className="pp-template-footer">
                <span className="pp-template-use-btn">
                  Use Template
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ─── Or Create Your Own ─── */}
      <section className="pp-section">
        <div className="pp-section-header">
          <div className="pp-section-divider" />
          <span className="pp-section-or">or</span>
          <div className="pp-section-divider" />
        </div>
        <div className="pp-section-header-text" style={{ textAlign: "center" }}>
          <h2 className="pp-section-title">Create Your Own</h2>
          <p className="pp-section-subtitle">
            Build a custom prompt pack from scratch with your own prompts
          </p>
        </div>

        <form className="pp-create-form" onSubmit={handleCreateCustom}>
          <div className="pp-form-row">
            <div className="pp-form-group">
              <label className="pp-form-label">Pack Name</label>
              <input
                type="text"
                className="pp-form-input"
                placeholder="e.g., My Product Shots"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                disabled={isCreating}
                required
              />
            </div>
            <div className="pp-form-group pp-form-group-grow">
              <label className="pp-form-label">Description (optional)</label>
              <input
                type="text"
                className="pp-form-input"
                placeholder="What is this pack for?"
                value={customDesc}
                onChange={(e) => setCustomDesc(e.target.value)}
                disabled={isCreating}
              />
            </div>
          </div>
          <button
            type="submit"
            className="pp-btn pp-btn-secondary pp-btn-create"
            disabled={isCreating || !customName.trim()}
          >
            {isCreating ? (
              <>
                <span className="pp-spinner" />
                Creating...
              </>
            ) : (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Create Empty Pack
              </>
            )}
          </button>
        </form>
      </section>

      {/* ─── Your Prompt Packs ─── */}
      <section className="pp-section">
        <div className="pp-section-header">
          <div className="pp-section-header-text">
            <h2 className="pp-section-title">
              Your Prompt Packs
              {packs.length > 0 && (
                <span className="pp-section-count">{packs.length}</span>
              )}
            </h2>
            <p className="pp-section-subtitle">
              Packs you&apos;ve created from templates or from scratch
            </p>
          </div>
        </div>

        {packs.length === 0 ? (
          <div className="pp-empty">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.3"
            >
              <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p>No prompt packs yet</p>
            <p className="pp-empty-hint">
              Start from a template above or create your own
            </p>
          </div>
        ) : (
          <div className="pp-packs-grid">
            {packs.map((pack) => (
              <button
                key={pack.id}
                className="pp-pack-card"
                onClick={() => router.push(`/prompt-packs/${pack.id}`)}
              >
                <div className="pp-pack-top">
                  <h3 className="pp-pack-name">{pack.name}</h3>
                  <span className="pp-pack-count">
                    {pack.item_count} prompt{pack.item_count !== 1 ? "s" : ""}
                  </span>
                </div>
                {pack.description && (
                  <p className="pp-pack-desc">{pack.description}</p>
                )}
                {pack.tags && pack.tags.length > 0 && (
                  <div className="pp-pack-tags">
                    {pack.tags.map((tag) => (
                      <span key={tag} className="pp-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="pp-pack-footer">
                  <span className="pp-pack-date">
                    {new Date(pack.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Template Preview Modal */}
      {selectedTemplate && (
        <TemplatePreviewModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
        />
      )}
    </>
  );
}
