"use client";

import { useState, useEffect } from "react";
import type { BatchItemResult } from "@/types/domain";

interface RetryModalProps {
  item: BatchItemResult;
  onClose: () => void;
  onRetry: (itemId: string, editedPrompt?: string) => void;
}

export function RetryModal({ item, onClose, onRetry }: RetryModalProps) {
  const [editedPrompt, setEditedPrompt] = useState(item.prompt);
  const [useEdited, setUseEdited] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const promptChanged = editedPrompt.trim() !== item.prompt.trim();

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Retry: {item.concept}</h2>
          <button
            className="modal-close-button"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          {item.error_message && (
            <div className="retry-error-info">
              <label className="field-label">Previous Error</label>
              <div className="retry-error-box">
                {item.error_code && (
                  <code className="error-code-cell">{item.error_code}</code>
                )}
                <p>{item.error_message}</p>
              </div>
            </div>
          )}

          <div className="retry-prompt-section">
            <label className="field-label">
              Prompt
              {item.retry_count > 0 && (
                <span className="field-hint"> (retry #{item.retry_count + 1})</span>
              )}
            </label>

            <div className="retry-prompt-toggle">
              <label className="retry-toggle-label">
                <input
                  type="checkbox"
                  checked={useEdited}
                  onChange={(e) => {
                    setUseEdited(e.target.checked);
                    if (!e.target.checked) setEditedPrompt(item.prompt);
                  }}
                />
                Edit prompt before retrying
              </label>
            </div>

            {useEdited ? (
              <textarea
                className="form-textarea"
                value={editedPrompt}
                onChange={(e) => setEditedPrompt(e.target.value)}
                rows={6}
                placeholder="Edit the prompt..."
              />
            ) : (
              <p className="field-value field-value-mono">{item.prompt}</p>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="button button-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="button"
            onClick={() => {
              onRetry(
                item.id,
                useEdited && promptChanged ? editedPrompt : undefined
              );
            }}
          >
            {useEdited && promptChanged ? "Retry with Edited Prompt" : "Retry with Original Prompt"}
          </button>
        </div>
      </div>
    </div>
  );
}
