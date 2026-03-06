"use client";

import { StatCard } from "../ui/StatCard";

interface BatchStatusCardsProps {
  queued: number;
  running: number;
  completed: number;
  failed: number;
}

export function BatchStatusCards({
  queued,
  running,
  completed,
  failed,
}: BatchStatusCardsProps) {
  return (
    <div className="status-cards-grid">
      <StatCard label="Queued" value={queued} />
      <StatCard label="Running" value={running} />
      <StatCard label="Completed" value={completed} />
      <StatCard label="Failed" value={failed} />
    </div>
  );
}
