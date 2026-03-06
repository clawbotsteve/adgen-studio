import { SkeletonLoader } from "@/components/ui/SkeletonLoader";

export default function Loading() {
  return (
    <div className="page-container">
      {/* Page Header Loading */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div className="page-header-top">
          <div className="page-header-content">
            <div className="skeleton" style={{ width: 250, height: 32, marginBottom: 12 }} />
          </div>
          <div className="skeleton" style={{ width: 150, height: 40 }} />
        </div>
      </div>

      {/* Monitor Section Loading */}
      <div className="card">
        <div style={{ padding: 24 }}>
          {/* Status Cards */}
          <div className="grid grid-4" style={{ gap: 16, marginBottom: 32 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <div className="skeleton" style={{ width: "100%", height: 20, marginBottom: 12 }} />
                <div className="skeleton" style={{ width: "100%", height: 32 }} />
              </div>
            ))}
          </div>

          {/* Progress Section */}
          <div style={{ marginBottom: 32 }}>
            <div className="skeleton" style={{ width: 150, height: 20, marginBottom: 12 }} />
            <div className="skeleton" style={{ width: "100%", height: 24 }} />
          </div>

          {/* Items Table */}
          <div>
            <div className="skeleton" style={{ width: 200, height: 24, marginBottom: 16 }} />
            <div className="table-header" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 16 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="skeleton" style={{ width: "100%", height: 20 }} />
              ))}
            </div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="table-row" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 16 }}>
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="skeleton" style={{ width: "100%", height: 16 }} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
