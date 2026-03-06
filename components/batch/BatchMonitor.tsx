"use client";

import Link from "next/link";
import { useState } from "react";
import { useBatchPolling } from "@/lib/hooks/useBatchPolling";
import { BatchStatusCards } from "./BatchStatusCards";
import { BatchProgressBar } from "./BatchProgressBar";
import { BatchControls } from "./BatchControls";
import { SkeletonLoader } from "../ui/SkeletonLoader";

interface BatchMonitorProps {
  runId: string;
}

export function BatchMonitor({ runId }: BatchMonitorProps) {
  const polling = useBatchPolling(runId, true, 2000);
  const [active, setActive] = useState(true);

  const formatElapsedTime = (startedAt: string | null): string => {
    if (!startedAt) return "-";
    const start = new Date(startedAt).getTime();
    const now = Date.now();
    const seconds = Math.floor((now - start) / 1000);

    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const isComplete =
    polling.status === "completed" ||
    polling.status === "stopped" ||
    polling.status === "failed";

  if (polling.loading && !polling.total_items) {
    return (
      <div className="batch-monitor">
        <SkeletonLoader lines={4} />
      </div>
    );
  }

  if (polling.error && !polling.total_items) {
    return (
      <div className="batch-monitor">
        <div className="error-card">
          <p>Failed to load batch status: {polling.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="batch-monitor">
      <div className="monitor-header">
        <div className="monitor-info">
          <div className="info-item">
            <span className="label">Run ID:</span>
            <span className="value">{runId}</span>
          </div>
          <div className="info-item">
            <span className="label">Elapsed:</span>
            <span className="value">{formatElapsedTime(polling.started_at)}</span>
          </div>
          <div className="info-item">
            <span className="label">Status:</span>
            <span className={`status-badge ${polling.status}`}>
              {polling.status}
            </span>
          </div>
        </div>
      </div>

      <div className="monitor-progress">
        <BatchProgressBar
          completed={polling.completed_count + polling.failed_count}
          total={polling.total_items}
        />
      </div>

      <div className="monitor-stats">
        <BatchStatusCards
          queued={polling.queued_count}
          running={polling.running_count}
          completed={polling.completed_count}
          failed={polling.failed_count}
        />
      </div>

      <div className="monitor-controls">
        <BatchControls
          runId={runId}
          status={polling.status}
          disabled={isComplete}
          onStatusChange={() => setActive(!active)}
        />
      </div>

      <div className="monitor-links">
        <Link href={`/batch/${runId}/outputs`} className="button button-secondary">
          View Outputs
        </Link>
        <Link href={`/batch/${runId}/errors`} className="button button-secondary">
          View Errors
        </Link>
      </div>
    </div>
  );
}
