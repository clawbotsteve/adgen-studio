"use client";
import { parseOutputUrl } from "@/lib/parseOutputUrl";

import { useState } from "react";

interface ContentItem {
  id: string;
  batch_run_id: string;
  concept: string;
  output_url: string | null;
  completed_at: string | null;
}

interface ContentGridProps {
  items: ContentItem[];
  clientNameMap: Record<string, string>; // item.batch_run_id -> client name
}

export function ContentGrid({ items, clientNameMap }: ContentGridProps) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [batchDownloading, setBatchDownloading] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 });

  const downloadableItems = items.filter((i) => i.output_url);

  async function downloadSingle(item: ContentItem) {
    if (!item.output_url) return;
    setDownloading(item.id);
    try {
      const safeName = (item.concept || "image")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .slice(0, 60);
      const fileName = `${safeName}.png`;

      const proxyUrl = `/api/download?url=${encodeURIComponent(item.output_url)}&name=${encodeURIComponent(fileName)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to download image. Please try again.");
    } finally {
      setDownloading(null);
    }
  }

  async function downloadAll() {
    if (downloadableItems.length === 0) return;
    setBatchDownloading(true);
    setBatchProgress({ done: 0, total: downloadableItems.length });

    // Download each image sequentially with a small delay
    for (let i = 0; i < downloadableItems.length; i++) {
      const item = downloadableItems[i];
      if (!item.output_url) continue;

      try {
        const safeName = (item.concept || `image-${i + 1}`)
          .replace(/[^a-zA-Z0-9_-]/g, "_")
          .slice(0, 60);
        const fileName = `${safeName}.png`;

        const proxyUrl = `/api/download?url=${encodeURIComponent(item.output_url)}&name=${encodeURIComponent(fileName)}`;
        const res = await fetch(proxyUrl);
        if (!res.ok) continue;

        const blob = await res.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      } catch {
        // Skip failed items
      }

      setBatchProgress({ done: i + 1, total: downloadableItems.length });
      // Small delay between downloads so browser doesn't block them
      if (i < downloadableItems.length - 1) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    setBatchDownloading(false);
    setBatchProgress({ done: 0, total: 0 });
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <h3 style={{ color: "var(--text-primary)", margin: 0 }}>
          Recent Generated Content ({items.length})
        </h3>
        {downloadableItems.length > 0 && (
          <button
            onClick={downloadAll}
            disabled={batchDownloading}
            className="button button-secondary"
            style={{ fontSize: "0.85rem", padding: "6px 14px", display: "flex", alignItems: "center", gap: 6 }}
          >
            {batchDownloading ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                Downloading {batchProgress.done}/{batchProgress.total}...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download All ({downloadableItems.length})
              </>
            )}
          </button>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 12,
        }}
      >
        {items.slice(0, 20).map((item) => {
          const cName = clientNameMap[item.batch_run_id] || "Unknown";
          const isDownloading = downloading === item.id;

          return (
            <div
              key={item.id}
              className="card cg-card"
              style={{ padding: 0, overflow: "hidden", position: "relative" }}
            >
              {parseOutputUrl(item.output_url) ? (
                <div className="cg-image-wrap">
                  <img
                    src={parseOutputUrl(item.output_url) || ""}
                    alt={item.concept}
                    style={{
                      width: "100%",
                      height: 160,
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                  {/* Download overlay on hover */}
                  <button
                    className="cg-download-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadSingle(item);
                    }}
                    disabled={isDownloading}
                    title="Download image"
                  >
                    {isDownloading ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    )}
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    height: 160,
                    background: "var(--bg-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-muted)",
                    fontSize: "0.85rem",
                  }}
                >
                  No preview
                </div>
              )}
              <div style={{ padding: "8px 12px" }}>
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {item.concept}
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    marginTop: 2,
                  }}
                >
                  {cName} Â·{" "}
                  {item.completed_at
                    ? new Date(item.completed_at).toLocaleDateString()
                    : "-"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
