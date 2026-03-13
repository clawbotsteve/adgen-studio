"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { BatchItemResult } from "@/types/domain";
import { parseOutputUrl } from "@/lib/parseOutputUrl";

interface AssetCardProps {
  item: BatchItemResult;
  selected: boolean;
  onSelect: (id: string) => void;
  onViewDetail: (item: BatchItemResult) => void;
}

export function AssetCard({
  item,
  selected,
  onSelect,
  onViewDetail,
}: AssetCardProps) {
  const [imgError, setImgError] = useState(false);

  const resolvedUrl = parseOutputUrl(item.output_url);
  const hasOutput = item.status === "completed" && resolvedUrl;

  return (
    <div
      className={`asset-card ${selected ? "selected" : ""} ${item.status}`}
      onClick={() => onViewDetail(item)}
    >
      <div className="asset-card-checkbox" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(item.id)}
          aria-label={`Select ${item.concept}`}
        />
      </div>

      <div className="asset-card-preview">
        {hasOutput && !imgError ? (
          <img
            src={resolvedUrl!}
            alt={item.concept}
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : item.status === "failed" ? (
          <div className="asset-card-error-preview">
            <span className="asset-card-error-icon">â</span>
            <span className="asset-card-error-text">Failed</span>
          </div>
        ) : item.status === "processing" || item.status === "queued" ? (
          <div className="asset-card-pending-preview">
            <span className="asset-card-pending-icon">â³</span>
            <span className="asset-card-pending-text">
              {item.status === "processing" ? "Processing..." : "Queued"}
            </span>
          </div>
        ) : (
          <div className="asset-card-empty-preview">
            <span>No preview</span>
          </div>
        )}
      </div>

      <div className="asset-card-info">
        <div className="asset-card-concept" title={item.concept}>
          {item.concept}
        </div>
        <div className="asset-card-meta">
          <StatusBadge status={item.status} />
          {item.retry_count > 0 && (
            <span className="asset-card-retry-count">
              {item.retry_count} {item.retry_count === 1 ? "retry" : "retries"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
