"use client";

import { useState, useEffect } from "react";

interface BatchStatusData {
  status: string;
  total_items: number;
  queued_count: number;
  running_count: number;
  completed_count: number;
  failed_count: number;
  started_at: string | null;
}

interface UseBatchPollingResult extends BatchStatusData {
  loading: boolean;
  error: string | null;
}

export function useBatchPolling(
  runId: string,
  active: boolean,
  intervalMs: number = 2000
): UseBatchPollingResult {
  const [status, setStatus] = useState<string>("loading");
  const [totalItems, setTotalItems] = useState<number>(0);
  const [queuedCount, setQueuedCount] = useState<number>(0);
  const [runningCount, setRunningCount] = useState<number>(0);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [failedCount, setFailedCount] = useState<number>(0);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;

    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/batch/${runId}/status`);
        if (!response.ok) {
          throw new Error("Failed to fetch batch status");
        }
        const data = (await response.json()) as BatchStatusData;
        setStatus(data.status);
        setTotalItems(data.total_items);
        setQueuedCount(data.queued_count);
        setRunningCount(data.running_count);
        setCompletedCount(data.completed_count);
        setFailedCount(data.failed_count);
        setStartedAt(data.started_at);
        setError(null);
        setLoading(false);

        // Auto-stop polling when batch is complete
        if (
          data.status === "completed" ||
          data.status === "stopped" ||
          data.status === "failed"
        ) {
          return; // This will trigger the cleanup
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    };

    // Fetch immediately
    fetchStatus();

    // Then poll at intervals
    const interval = setInterval(fetchStatus, intervalMs);

    return () => clearInterval(interval);
  }, [runId, active, intervalMs]);

  return {
    status,
    total_items: totalItems,
    queued_count: queuedCount,
    running_count: runningCount,
    completed_count: completedCount,
    failed_count: failedCount,
    started_at: startedAt,
    loading,
    error,
  };
}
