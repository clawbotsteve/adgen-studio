interface SkeletonLoaderProps {
  lines?: number;
  height?: string;
}

export function SkeletonLoader({
  lines = 3,
  height = "12px",
}: SkeletonLoaderProps) {
  return (
    <div>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton skeleton-line"
          style={{ height }}
        />
      ))}
    </div>
  );
}
