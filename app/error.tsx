"use client";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="page-container">
      <div className="page-section">
        <div className="card" style={{ maxWidth: 600, margin: "0 auto", padding: 40 }}>
          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: "2.5rem", marginBottom: 16, color: "var(--color-error)" }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: "1.125rem", color: "var(--color-text-secondary)", marginBottom: 24 }}>
              An error occurred while rendering this page. Please try again.
            </p>

            {process.env.NODE_ENV === "development" && error.message && (
              <div
                style={{
                  backgroundColor: "var(--color-bg-tertiary)",
                  padding: 16,
                  borderRadius: "8px",
                  marginBottom: 24,
                  textAlign: "left",
                  border: "1px solid var(--color-border)",
                  fontSize: "0.875rem",
                  fontFamily: "monospace",
                  overflow: "auto",
                  maxHeight: 200,
                }}
              >
                <p style={{ margin: 0, color: "var(--color-error)" }}>
                  <strong>Error Details:</strong>
                </p>
                <p style={{ margin: "8px 0 0 0", color: "var(--color-text-secondary)" }}>
                  {error.message}
                </p>
              </div>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={() => reset()} className="button">
                Try Again
              </button>
              <a href="/" className="button button-secondary">
                Go Home
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
