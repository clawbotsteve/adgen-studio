import { SkeletonLoader } from "@/components/ui/SkeletonLoader";

export default function Loading() {
  return (
    <div className="page-section">
      <div className="grid" style={{ gap: 20 }}>
        {/* Stats Cards Loading */}
        <div className="grid grid-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card">
              <div className="badge" style={{ width: 60, height: 16 }}>
                <div className="skeleton" style={{ width: "100%", height: "100%" }} />
              </div>
              <h3 style={{ marginTop: 12 }}>
                <div className="skeleton" style={{ width: 40, height: 24 }} />
              </h3>
            </div>
          ))}
        </div>

        {/* Form Section Loading */}
        <div className="card">
          <h3 style={{ marginTop: 0 }}>
            <div className="skeleton" style={{ width: 120, height: 24, marginBottom: 16 }} />
          </h3>
          <SkeletonLoader lines={4} />
        </div>

        {/* Table Loading */}
        <div className="card">
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>
            <div className="skeleton" style={{ width: 140, height: 24 }} />
          </h3>
          <div className="table-header" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ width: "100%", height: 20 }} />
            ))}
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="table-row" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
              {[1, 2, 3].map((j) => (
                <div key={j} className="skeleton" style={{ width: "100%", height: 16 }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
