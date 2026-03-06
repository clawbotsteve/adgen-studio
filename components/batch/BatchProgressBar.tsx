"use client";

interface BatchProgressBarProps {
  completed: number;
  total: number;
}

export function BatchProgressBar({
  completed,
  total,
}: BatchProgressBarProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="progress-container">
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${percentage}%` }} />
      </div>
      <div className="progress-text">
        {completed} of {total} items
      </div>
    </div>
  );
}
