"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RetryModal } from "./RetryModal";
import type { BatchItemResult } from "@/types/domain";

interface ErrorTableProps {
  errors: BatchItemResult[];
  onRetrySingle: (itemId: string, editedPrompt?: string) => void;
  onRetryAll: () => void;
  isRetrying: boolean;
}

export function ErrorTable({
  errors,
  onRetrySingle,
  onRetryAll,
  isRetrying,
}: ErrorTableProps) {
  const [retryItem, setRetryItem] = useState<BatchItemResult | null>(null);

  if (errors.length === 0) {
    return (
      <div className="error-table-empty">
        <div className="error-table-empty-icon">✓</div>
        <h3>No Errors</h3>
        <p>All items completed successfully.</p>
      </div>
    );
  }

  return (
    <div className="error-table-container">
      <div className="error-table-toolbar">
        <span className="error-table-count">
          {errors.length} failed item{errors.length !== 1 ? "s" : ""}
        </span>
        <button
          className="button button-sm"
          onClick={onRetryAll}
          disabled={isRetrying}
        >
          {isRetrying ? "Retrying..." : `Retry All ${errors.length} Failed`}
        </button>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Concept</th>
              <th>Error</th>
              <th>Code</th>
              <th>Retries</th>
              <th>Failed At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {errors.map((err) => (
              <tr key={err.id}>
                <td>
                  <span className="error-concept" title={err.concept}>
                    {err.concept}
                  </span>
                </td>
                <td>
                  <span className="error-message-cell" title={err.error_message ?? ""}>
                    {err.error_message || "Unknown error"}
                  </span>
                </td>
                <td>
                  {err.error_code ? (
                    <code className="error-code-cell">{err.error_code}</code>
                  ) : (
                    "-"
                  )}
                </td>
                <td>{err.retry_count}</td>
                <td>
                  {err.completed_at
                    ? new Date(err.completed_at).toLocaleString()
                    : "-"}
                </td>
                <td>
                  <button
                    className="button button-ghost button-sm"
                    onClick={() => setRetryItem(err)}
                    disabled={isRetrying}
                  >
                    Retry
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {retryItem && (
        <RetryModal
          item={retryItem}
          onClose={() => setRetryItem(null)}
          onRetry={(itemId, editedPrompt) => {
            onRetrySingle(itemId, editedPrompt);
            setRetryItem(null);
          }}
        />
      )}
    </div>
  );
}
