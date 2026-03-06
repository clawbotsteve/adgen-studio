import Link from "next/link";

export const metadata = {
  title: "Not Found",
};

export default function NotFound() {
  return (
    <div className="page-container">
      <div className="page-section">
        <div className="card" style={{ maxWidth: 600, margin: "0 auto", padding: 40 }}>
          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: "3.75rem", fontWeight: 700, marginBottom: 16, color: "var(--color-accent)" }}>
              404
            </h1>
            <h2 style={{ fontSize: "1.875rem", marginBottom: 12, color: "var(--color-text-primary)" }}>
              Page Not Found
            </h2>
            <p style={{ fontSize: "1.125rem", color: "var(--color-text-secondary)", marginBottom: 32 }}>
              The page you're looking for doesn't exist or has been moved.
            </p>

            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/" className="button">
                Go Home
              </Link>
              <Link href="/history" className="button button-secondary">
                View Batch Runs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
