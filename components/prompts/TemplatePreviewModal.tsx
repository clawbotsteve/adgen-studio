"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/hooks/useToast";
import type { PromptTemplate } from "@/lib/constants/promptTemplates";

interface TemplatePreviewModalProps {
  template: PromptTemplate;
  onClose: () => void;
}

export function TemplatePreviewModal({
  template,
  onClose,
}: TemplatePreviewModalProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [name, setName] = useState(template.name);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleCreate = async () => {
    if (!name.trim()) {
      addToast("Pack name is required", "error");
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch("/api/prompt-packs/use-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: template.id,
          customName: name.trim(),
        }),
      });

      if (!res.ok) {
        addToast("Failed to create pack from template", "error");
        return;
      }

      const data = await res.json();
      addToast(`"${name}" created with ${template.items.length} prompts`, "success");
      onClose();
      router.push(`/prompt-packs/${data.pack.id}`);
      router.refresh();
    } catch {
      addToast("An error occurred", "error");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="pp-modal-overlay" onClick={onClose}>
      <div className="pp-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="pp-modal-header">
          <div className="pp-modal-header-left">
            <div
              className="pp-template-icon"
              style={{ background: template.color }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={template.icon} />
              </svg>
            </div>
            <div>
              <h2 className="pp-modal-title">{template.name}</h2>
              <p className="pp-modal-subtitle">
                {template.items.length} prompts included
              </p>
            </div>
          </div>
          <button className="pp-modal-close" onClick={onClose}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Description */}
        <p className="pp-modal-desc">{template.description}</p>

        {/* Pack Name Input */}
        <div className="pp-modal-name-section">
          <label className="pp-form-label">Pack Name</label>
          <input
            type="text"
            className="pp-form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter a name for your pack"
            disabled={isCreating}
          />
        </div>

        {/* Prompt Items Preview */}
        <div className="pp-modal-items-section">
          <label className="pp-form-label">Included Prompts</label>
          <div className="pp-modal-items-list">
            {template.items.map((item, i) => (
              <div key={i} className="pp-modal-item">
                <div className="pp-modal-item-header">
                  <span className="pp-modal-item-number">{i + 1}</span>
                  <span className="pp-modal-item-concept">{item.concept}</span>
                </div>
                <p className="pp-modal-item-text">{item.prompt_text}</p>
                <div className="pp-modal-item-tags">
                  {item.tags.map((tag) => (
                    <span key={tag} className="pp-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pp-modal-footer">
          <button
            className="pp-btn pp-btn-secondary"
            onClick={onClose}
            disabled={isCreating}
          >
            Cancel
          </button>
          <button
            className="pp-btn pp-btn-primary"
            onClick={handleCreate}
            disabled={isCreating || !name.trim()}
          >
            {isCreating ? (
              <>
                <span className="pp-spinner" />
                Creating...
              </>
            ) : (
              <>
                Create Pack
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
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
