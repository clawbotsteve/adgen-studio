"use client";

import { useState, useCallback } from "react";
import type { Client, ReferenceImage } from "@/types/domain";
import { CreativeLibrary } from "./CreativeLibrary";

interface BatchGeneratePageProps {
  clients: Client[];
}

const ASPECT_RATIOS = [
  { value: "1:1", label: "1:1 (Square)" },
  { value: "9:16", label: "9:16 (Portrait)" },
] as const;

const RESOLUTIONS = [
  { value: "1K", label: "1K" },
  { value: "2K", label: "2K" },
  { value: "4K", label: "4K" },
] as const;

const BATCH_SIZES = [5, 10, 30, 50] as const;

export function BatchGeneratePage({ clients }: BatchGeneratePageProps) {
  const [clientId, setClientId] = useState<string>(clients[0]?.id ?? "");
  const [images, setImages] = useState<ReferenceImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<ReferenceImage | null>(null);
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [resolution, setResolution] = useState("1K");
  const [batchSize, setBatchSize] = useState<number>(5);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Array<{ url: string; error?: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingImages, setLoadingImages] = useState(false);

  const fetchImages = useCallback(async (cId: string) => {
    if (!cId) return;
    setLoadingImages(true);
    try {
      const res = await fetch(`/api/references?clientId=${cId}`);
      const data = await res.json();
      setImages(data.references ?? []);
      setSelectedImage(null);
    } catch {
      setImages([]);
    } finally {
      setLoadingImages(false);
    }
  }, []);

  const handleClientChange = useCallback((newClientId: string) => {
    setClientId(newClientId);
    setSelectedImage(null);
    setResults([]);
    setError(null);
    fetchImages(newClientId);
  }, [fetchImages]);

  useState(() => {
    if (clientId) fetchImages(clientId);
  });

  const handleUpload = useCallback(async (file: File) => {
    if (!clientId) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("clientId", clientId);
      formData.append("label", "identity");
      const res = await fetch("/api/generate/upload", { method: "POST", body: formData });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Upload failed"); }
      const data = await res.json();
      const newImage = data.image as ReferenceImage;
      setImages((prev) => [newImage, ...prev]);
      setSelectedImage(newImage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [clientId]);

  const handleDelete = useCallback(async (imageId: string) => {
    try {
      await fetch(`/api/references/${imageId}`, { method: "DELETE" });
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      if (selectedImage?.id === imageId) setSelectedImage(null);
    } catch {}
  }, [selectedImage]);
  const handleBatchGenerate = useCallback(async () => {
    if (!selectedImage || !prompt.trim()) return;
    setGenerating(true);
    setError(null);
    setResults([]);
    setProgress(0);

    const newResults: Array<{ url: string; error?: string }> = [];

    for (let i = 0; i < batchSize; i++) {
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId,
            prompt: prompt.trim(),
            referenceImageUrl: selectedImage.url,
            aspectRatio,
            resolution,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          newResults.push({ url: "", error: data.error || "Failed" });
        } else {
          const data = await res.json();
          newResults.push({ url: data.outputUrl });
        }
      } catch (err) {
        newResults.push({ url: "", error: err instanceof Error ? err.message : "Failed" });
      }
      setProgress(i + 1);
      setResults([...newResults]);
    }
    setGenerating(false);
  }, [clientId, selectedImage, prompt, aspectRatio, resolution, batchSize]);

  const canGenerate = selectedImage && prompt.trim() && !generating;
  const successCount = results.filter((r) => r.url).length;
  const failCount = results.filter((r) => r.error).length;
  return (
    <div className="generate-page">
      <div className="generate-header">
        <h1>Batch Generate</h1>
        <div className="generate-client-select">
          <label htmlFor="client-select">Client:</label>
          <select id="client-select" value={clientId} onChange={(e) => handleClientChange(e.target.value)}>
            {clients.length === 0 && <option value="">No clients yet</option>}
            {clients.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
        </div>
      </div>

      {error && (
        <div className="generate-error">
          <span>{error}</span>
          <button onClick={() => setError(null)}>\u00d7</button>
        </div>
      )}

      <div className="generate-content">
        {/* LEFT: Generate Panel */}
        <div className="generate-panel">
          {selectedImage ? (
            <div className="selected-preview">
              <label>Reference Image</label>
              <img src={selectedImage.url} alt="Selected reference" />
            </div>
          ) : (
            <div className="selected-preview empty">
              <span>Select an image from the library</span>
            </div>
          )}

          <div className="generate-setting">
            <label>Batch Size</label>
            <div className="setting-options">
              {BATCH_SIZES.map((size) => (
                <button key={size} className={`setting-option ${batchSize === size ? "active" : ""}`} onClick={() => setBatchSize(size)} type="button">{size}</button>
              ))}
            </div>
          </div>

          <div className="generate-setting">
            <label>Aspect Ratio</label>
            <div className="setting-options">
              {ASPECT_RATIOS.map((ar) => (
                <button key={ar.value} className={`setting-option ${aspectRatio === ar.value ? "active" : ""}`} onClick={() => setAspectRatio(ar.value)} type="button">{ar.label}</button>
              ))}
            </div>
          </div>

          <div className="generate-setting">
            <label>Resolution</label>
            <div className="setting-options">
              {RESOLUTIONS.map((r) => (
                <button key={r.value} className={`setting-option ${resolution === r.value ? "active" : ""}`} onClick={() => setResolution(r.value)} type="button">{r.label}</button>
              ))}
            </div>
          </div>

          <div className="generate-prompt">
            <label htmlFor="prompt-input">Prompt</label>
            <textarea id="prompt-input" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe what you want to generate..." rows={4} />
          </div>

          <button className="btn btn-primary btn-generate" disabled={!canGenerate} onClick={handleBatchGenerate}>
            {generating ? (<><span className="btn-spinner" />Generating {progress}/{batchSize}...</>) : `Generate ${batchSize} Images`}
          </button>

          {generating && (
            <div className="batch-progress">
              <div className="batch-progress-bar" style={{ width: `${(progress / batchSize) * 100}%` }} />
            </div>
          )}

          {results.length > 0 && !generating && (
            <div className="batch-summary">
              <span>{successCount} succeeded</span>
              {failCount > 0 && <span className="batch-fail">{failCount} failed</span>}
            </div>
          )}
        </div>

        {/* RIGHT: Creative Library + Results */}
        <div className="generate-library-section">
          {results.length > 0 ? (
            <div className="batch-results">
              <h3>Generated Images ({successCount}/{batchSize})</h3>
              <div className="batch-results-grid">
                {results.filter((r) => r.url).map((r, i) => (
                  <div key={i} className="batch-result-item">
                    <img src={r.url} alt={`Generated ${i + 1}`} />
                  </div>
                ))}
              </div>
            </div>
          ) : loadingImages ? (
            <div className="generate-loading">Loading images...</div>
          ) : (
            <CreativeLibrary
              images={images}
              selectedImage={selectedImage}
              onSelect={setSelectedImage}
              onUpload={handleUpload}
              onDelete={handleDelete}
              uploading={uploading}
            />
          )}
        </div>
      </div>
    </div>
  );
}
