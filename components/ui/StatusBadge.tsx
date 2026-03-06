interface StatusBadgeProps {
  status: string;
}

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  queued: { label: "Queued", className: "status-badge queued" },
  running: { label: "Running", className: "status-badge running" },
  processing: { label: "Processing", className: "status-badge processing" },
  completed: { label: "Completed", className: "status-badge completed" },
  failed: { label: "Failed", className: "status-badge failed" },
  paused: { label: "Paused", className: "status-badge paused" },
  stopped: { label: "Stopped", className: "status-badge stopped" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    className: "status-badge queued",
  };

  return <span className={config.className}>{config.label}</span>;
}
