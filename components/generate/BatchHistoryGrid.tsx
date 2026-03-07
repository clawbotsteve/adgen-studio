"use client";

import { useState } from "react";

interface Generation {
  id: string;
  output_url: string;
  prompt: string;
  aspect_ratio: string;
  resolution: string;
  created_at: string;
}

interface Props {
  grouped: Record<string, Generation[]>;
  clientNames: string[];
}

export default function BatchHistoryGrid({ grouped, clientNames }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleDownload = async (url: string, prompt: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const safeName = prompt.slice(0, 30).replace(/[^a-zA-Z0-9]/g, "_");
      a.download = `adgen_${safeName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  return (
    <>
      {clientNames.map((clientName) => (
        <div key={clientName} className="card" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem", color: "#e2e8f0" }}>
            {clientName} ({grouped[clientName]!.length} generations)
          </h2>
          <div className="batch-history-grid">
            {grouped[clientName]!.map((gen) => (
              <div key={gen.id} className="batch-history-item">
                <div className="clickable-image" onClick={() => setPreviewUrl(gen.output_url)}>
                  <img src={gen.output_url} alt={gen.prompt} />
                  <div className="image-hover-hint">Click to preview</div>
                </div>
                <div className="batch-history-meta">
                  <p className="batch-history-prompt">{gen.prompt}</p>
                  <span className="batch-history-details">
                    {gen.aspect_ratio} &middot; {gen.resolution} &middot; {new Date(gen.created_at).toLocaleDateString()}
                  </span>
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <button className="btn-icon" onClick={() => handleDownload(gen.output_url, gen.prompt)} title="Download">
                      ⬇ Download
                    </button>
                    <button className="btn-icon" onClick={() => setPreviewUrl(gen.output_url)} title="Preview">
                      🔍 Preview
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {previewUrl && (
        <div className="preview-modal-overlay" onClick={() => setPreviewUrl(null)}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <button className="preview-modal-close" onClick={() => setPreviewUrl(null)}>&times;</button>
            <img src={previewUrl} alt="Preview" style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: "8px" }} />
          </div>
        </div>
      )}
    </>
  );
}