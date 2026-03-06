"use client";

import { useState, useMemo } from "react";
import { AssetCard } from "./AssetCard";
import { AssetDetailModal } from "./AssetDetailModal";
import { BulkActions } from "./BulkActions";
import type { BatchItemResult } from "@/types/domain";

type FilterTab = "all" | "completed" | "failed" | "processing" | "queued";

interface AssetGridProps {
  items: BatchItemResult[];
  batchRunId: string;
  onRetryItem?: (itemId: string, editedPrompt?: string) => void;
  onBulkRetry?: (itemIds: string[]) => void;
}

export function AssetGrid({
  items,
  batchRunId,
  onRetryItem,
  onBulkRetry,
}: AssetGridProps) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailItem, setDetailItem] = useState<BatchItemResult | null>(null);

  const counts = useMemo(() => {
    const c = { all: items.length, completed: 0, failed: 0, processing: 0, queued: 0 };
    items.forEach((i) => {
      if (i.status === "completed") c.completed++;
      else if (i.status === "failed") c.failed++;
      else if (i.status === "processing") c.processing++;
      else if (i.status === "queued") c.queued++;
    });
    return c;
  }, [items]);

  const filteredItems = useMemo(() => {
    if (activeFilter === "all") return items;
    return items.filter((i) => i.status === activeFilter);
  }, [items, activeFilter]);

  const handleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((i) => i.id)));
    }
  };

  const selectedItems = items.filter((i) => selectedIds.has(i.id));

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: `All (${counts.all})` },
    { key: "completed", label: `Success (${counts.completed})` },
    { key: "failed", label: `Failed (${counts.failed})` },
    { key: "processing", label: `Processing (${counts.processing})` },
    { key: "queued", label: `Queued (${counts.queued})` },
  ];

  return (
    <div className="asset-grid-container">
      <div className="asset-grid-toolbar">
        <div className="asset-filter-tabs">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              className={`filter-tab ${activeFilter === tab.key ? "active" : ""}`}
              onClick={() => {
                setActiveFilter(tab.key);
                setSelectedIds(new Set());
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="asset-grid-actions">
          {filteredItems.length > 0 && (
            <button className="button button-ghost button-sm" onClick={handleSelectAll}>
              {selectedIds.size === filteredItems.length ? "Deselect All" : "Select All"}
            </button>
          )}
        </div>
      </div>

      {selectedIds.size > 0 && (
        <BulkActions
          selectedItems={selectedItems}
          batchRunId={batchRunId}
          onRetrySelected={onBulkRetry}
          onClearSelection={() => setSelectedIds(new Set())}
        />
      )}

      {filteredItems.length === 0 ? (
        <div className="asset-grid-empty">
          <p>No {activeFilter === "all" ? "" : activeFilter} items to display.</p>
        </div>
      ) : (
        <div className="asset-grid">
          {filteredItems.map((item) => (
            <AssetCard
              key={item.id}
              item={item}
              selected={selectedIds.has(item.id)}
              onSelect={handleSelect}
              onViewDetail={setDetailItem}
            />
          ))}
        </div>
      )}

      {detailItem && (
        <AssetDetailModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onRetry={onRetryItem}
        />
      )}
    </div>
  );
}
