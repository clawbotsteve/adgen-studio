import { SkeletonLoader } from "@/components/ui/SkeletonLoader";

export default function Loading() {
  return (
    <div className="page-container">
      {/* Page Header Loading */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div className="page-header-top">
          <div className="page-header-content">
            <div className="skeleton" style={{ width: 250, height: 32, marginBottom: 12 }} />
            <div className="skeleton" style={{ width: 450, height: 20 }} />
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 24 }}>
        {/* Upload Section Loading */}
        <div className="card">
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>
            <div className="skeleton" style={{ width: 180, height: 24 }} />
          </h3>
          <SkeletonLoader lines={4} />
        </div>

        {/* Grid Loading */}
        <div className="card">
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>
            <div className="skeleton" style={{ width: 180, height: 24 }} />
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 16 }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton" style={{ width: "100%", aspectRatio: "1", borderRadius: "8px" }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
