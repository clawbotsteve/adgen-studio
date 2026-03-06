import { SkeletonLoader } from "@/components/ui/SkeletonLoader";

export default function Loading() {
  return (
    <div className="page-container">
      {/* Page Header Loading */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div className="page-header-top">
          <div className="page-header-content">
            <div className="skeleton" style={{ width: 220, height: 32, marginBottom: 12 }} />
            <div className="skeleton" style={{ width: 350, height: 20 }} />
          </div>
          <div className="skeleton" style={{ width: 150, height: 40 }} />
        </div>
      </div>

      {/* Table Section Loading */}
      <div className="card">
        <div className="table-header" style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 12, marginBottom: 16 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="skeleton" style={{ width: "100%", height: 20 }} />
          ))}
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="table-row" style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 12, marginBottom: 16 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((j) => (
              <div key={j} className="skeleton" style={{ width: "100%", height: 16 }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
