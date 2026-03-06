import { SkeletonLoader } from "@/components/ui/SkeletonLoader";

export default function Loading() {
  return (
    <div className="page-container">
      {/* Page Header Loading */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div className="page-header-top">
          <div className="page-header-content">
            <div className="skeleton" style={{ width: 200, height: 32, marginBottom: 12 }} />
            <div className="skeleton" style={{ width: 450, height: 20 }} />
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 24 }}>
        {/* Form Section Loading */}
        <div className="card">
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>
            <div className="skeleton" style={{ width: 150, height: 24 }} />
          </h3>
          <SkeletonLoader lines={6} />
        </div>

        {/* Table Section Loading */}
        <div className="card">
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>
            <div className="skeleton" style={{ width: 150, height: 24 }} />
          </h3>
          <div className="table-header" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton" style={{ width: "100%", height: 20 }} />
            ))}
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="table-row" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="skeleton" style={{ width: "100%", height: 16 }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
