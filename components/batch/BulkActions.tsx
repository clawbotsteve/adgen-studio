"use client";

import type { BatchItemResult } from "@/types/domain";

interface BulkActionsProps {
  selectedItems: BatchItemResult[];
  batchRunId: string;
  onRetrySelected?: (itemIds: string[]) => void;
  onClearSelection: () => void;
}

export function BulkActions({
  selectedItems,
  batchRunId,
  onRetrySelected,
  onClearSelection,
}: BulkActionsProps) {
  const failedItems = selectedItems.filter((i) => i.status === "failed");
  const completedItems = selectedItems.filter((i) => i.status === "completed");

  const handleExportCSV = () => {
    const headers = ["concept", "prompt", "status", "output_url", "error_message"];
    const rows = selectedItems.map((item) =>
      headers.map((h) => {
        const val = item[h as keyof BatchItemResult];
        return typeof val === "string" ? `"${val.replace(/"/g, '""')}"` : val ?? "";
      }).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `batch-${batchRunId}-export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const data = selectedItems.map((item) => ({
      id: item.id,
      concept: item.concept,
      prompt: item.prompt,
      status: item.status,
      output_url: item.output_url,
      error_message: item.error_message,
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `batch-${batchRunId}-export.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bulk-actions-bar">
      <span className="bulk-actions-count">
        {selectedItems.length} item{selectedItems.length !== 1 ? "s" : ""} selected
      </span>

      <div className="bulk-actions-buttons">
        {failedItems.length > 0 && onRetrySelected && (
          <button
            className="button button-sm"
            onClick={() =>
              onRetrySelected(failedItems.map((i) => i.id))
            }
          >
            Retry {failedItems.length} Failed
          </button>
        )}

        <button className="button button-ghost button-sm" onClick={handleExportCSV}>
          Export CSV
        </button>

        <button className="button button-ghost button-sm" onClick={handleExportJSON}>
          Export JSON
        </button>

        {completedItems.length > 0 && (
          <button
            className="button button-ghost button-sm"
            onClick={() => {
              completedItems.forEach((item) => {
                if (item.output_url) {
                  window.open(item.output_url, "_blank");
                }
              });
            }}
          >
            Open {completedItems.length} in New Tabs
          </button>
        )}

        <button
          className="button button-ghost button-sm"
          onClick={onClearSelection}
        >
          Clear Selection
        </button>
      </div>
    </div>
  );
}
