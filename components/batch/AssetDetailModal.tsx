"use client";

import { useState, useEffect } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { BatchItemResult } from "@/types/domain";

interface AssetDetailModalProps {
  item: BatchItemResult;
  onClose: () => void;
  onRetry?: (itemId: string, editedPrompt?: string) => void;
}

export function AssetDetailModal({
  item,
  onClose,
  onRetry,
}: AssetDetailModalProps) {
  const [editedPrompt, setEditedPrompt] = useState(item.prompt);
  const [showRetryForm, setShowRetryForm] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const hasOutput = item.status === "completed" && item.output_url;
  const canRetry = item.status === "failed" && onRetry;

  const handleRetry = () => {
    if (onRetry) {
      const promptChanged = editedPrompt !== item.prompt;
      onRetry(item.id, promptChanged ? editedPrompt : undefined);
      onClose();
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content modal-lg">
        <div className="modal-header">
          <h2 className="modal-title">{item.concept}</h2>
          <button
            className="modal-close-button"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="asset-detail-layout">
            {/* Preview Panel */}
            <div className="asset-detail-preview">
              {hasOutput && !imgError ? (
                <img
                  src={item.output_url!}
                  alt={item.concept}
                  className="asset-detail-image"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="asset-detail-no-preview">
                  <span>{item.status === "failed" ? "Generation Failed" : "No output"}</span>
                </div>
              )}
            </div>

            {/* Info Panel */}
            <div className="asset-detail-info">
              <div className="asset-detail-field">
                <label className="field-label">Status</label>
                <StatusBadge status={item.status} />
              </div>

              <div className="asset-detail-field">
                <label className="field-label">Concept</label>
                <p className="field-value">{item.concept}</p>
              </div>

              <div className="asset-detail-field">
                <label className="field-label">Prompt</label>
                <p className="field-value field-value-mono">{item.prompt}</p>
              </div>

              {item.error_message && (
                <div className="asset-detail-field">
                  <label className="field-label">Error</label>
                  <div className="asset-detail-error">
                    {item.error_code && (
                      <span className="error-code">{item.error_code}</span>
                    )}
                    <p className="error-message">{item.error_message}</p>
                  </div>
                </div>
              )}

              <div className="asset-detail-field">
                <label className="field-label">Retries</label>
                <p className="field-value">{item.retry_count}</p>
              </div>

              {item.started_at && (
                <div className="asset-detail-field">
                  <label className="field-label">Started</label>
                  <p className="field-value">
                    {new Date(item.started_at).toLocaleString()}
                  </p>
                </div>
              )}

              {item.completed_at && (
                <div className="asset-detail-field">
                  <label className="field-label">Completed</label>
                  <p className="field-value">
                    {new Date(item.completed_at).toLocaleString()}
                  </p>
                </div>
              )}

              {hasOutput && (
                <a
                  href={item.output_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button button-sm"
                  style={{ marginTop: "var(--space-2)" }}
                >
                  Open Full Size ↗
                </a>
              )}
            </div>
          </div>

          {/* Retry Section */}
          {canRetry && !showRetryForm && (
            <div className="asset-detail-retry-cta">
              <button
                className="button"
                onClick={() => setShowRetryForm(true)}
              >
                Retry This Item
              </button>
            </div>
          )}

          {canRetry && showRetryForm && (
            <div className="asset-detail-retry-form">
              <label className="field-label">Edit Prompt (optional)</label>
              <textarea
                className="form-textarea"
                value={editedPrompt}
                onChange={(e) => setEditedPrompt(e.target.value)}
                rows={4}
              />
              <div className="asset-detail-retry-actions">
                <button
                  className="button button-secondary"
                  onClick={() => {
                    setShowRetryForm(false);
                    setEditedPrompt(item.prompt);
                  }}
                >
                  Cancel
                </button>
                <button className="button" onClick={handleRetry}>
                  Retry with {editedPrompt !== item.prompt ? "Edited" : "Original"} Prompt
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
