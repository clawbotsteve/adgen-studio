import { SkeletonLoader } from "@/components/ui/SkeletonLoader";

export default function Loading() {
  return (
    <div className="page-container">
      {/* Page Header Loading */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div className="page-header-top">
          <div className="page-header-content">
            <div className="skeleton" style={{ width: 200, height: 32, marginBottom: 12 }} />
            <div className="skeleton" style={{ width: 400, height: 20 }} />
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 24 }}>
        {/* Form Section Loading */}
        <div className="card">
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>
            <div className="skeleton" style={{ width: 150, height: 24 }} />
          </h3>
          <SkeletonLoader lines={5} />
        </div>

        {/* List Section Loading */}
        <div className="card">
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>
            <div className="skeleton" style={{ width: 150, height: 24 }} />
          </h3>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ padding: 16, borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ width: 200, height: 20, marginBottom: 8 }} />
                <div className="skeleton" style={{ width: 300, height: 16 }} />
              </div>
              <div className="skeleton" style={{ width: 80, height: 32 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
