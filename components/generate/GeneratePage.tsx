"use client";

import { useState, useCallback } from "react";
import type { Client, ReferenceImage } from "@/types/domain";
import { CreativeLibrary } from "./CreativeLibrary";

interface GeneratePageProps {
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

export function GeneratePage({ clients }: GeneratePageProps) {
  const [clientId, setClientId] = useState<string>(clients[0]?.id ?? "");
  const [images, setImages] = useState<ReferenceImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<ReferenceImage | null>(null);
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [resolution, setResolution] = useState("1K");
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingImages, setLoadingImages] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
    setOutputUrl(null);
    setError(null);
    fetchImages(newClientId);
  }, [fetchImages]);

  useState(() => { if (clientId) fetchImages(clientId); });

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
  const handleGenerate = useCallback(async () => {
    if (!selectedImage || !prompt.trim()) return;
    setGenerating(true);
    setError(null);
    setOutputUrl(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, prompt: prompt.trim(), referenceImageUrl: selectedImage.url, aspectRatio, resolution }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Generation failed"); }
      const data = await res.json();
      setOutputUrl(data.outputUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }, [clientId, selectedImage, prompt, aspectRatio, resolution]);

  const handleDownload = useCallback(async (url: string, filename?: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename || "generated-image.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(url, "_blank");
    }
  }, []);

  const handleSaveToLibrary = useCallback(async () => {
    if (!outputUrl || !clientId) return;
    try {
      const res = await fetch("/api/references", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId, label: "identity", url: outputUrl }),
      });
      if (res.ok) { const data = await res.json(); setImages((prev) => [data.reference, ...prev]); }
    } catch {}
  }, [outputUrl, clientId]);

  const canGenerate = selectedImage && prompt.trim() && !generating;
  return (
    <div className="generate-page">
      {/* Preview Modal */}
      {previewUrl && (
        <div className="preview-modal-overlay" onClick={() => setPreviewUrl(null)}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <button className="preview-modal-close" onClick={() => setPreviewUrl(null)}>\u00d7</button>
            <img src={previewUrl} alt="Preview" />
            <div className="preview-modal-actions">
              <button className="btn btn-primary btn-sm" onClick={() => handleDownload(previewUrl)}>Download</button>
            </div>
          </div>
        </div>
      )}

      <div className="generate-header">
        <h1>Generate</h1>
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

          <button className="btn btn-primary btn-generate" disabled={!canGenerate} onClick={handleGenerate}>
            {generating ? (<><span className="btn-spinner" />Generating...</>) : "Generate"}
          </button>

          {outputUrl && (
            <div className="generate-output">
              <label>Generated Image</label>
              <div className="generate-output-image-wrap">
                <img src={outputUrl} alt="Generated output" onClick={() => setPreviewUrl(outputUrl)} className="clickable-image" />
                <div className="image-hover-hint">Click to preview</div>
              </div>
              <div className="generate-output-actions">
                <button className="btn btn-sm btn-primary" onClick={() => handleDownload(outputUrl)}>⬇ Download</button>
                <button className="btn btn-sm btn-secondary" onClick={() => setPreviewUrl(outputUrl)}>🔍 Preview</button>
                <button className="btn btn-sm btn-secondary" onClick={handleSaveToLibrary}>💾 Save to Library</button>
              </div>
            </div>
          )}
        </div>

        <div className="generate-library-section">
          {loadingImages ? (
            <div className="generate-loading">Loading images...</div>
          ) : (
            <CreativeLibrary images={images} selectedImage={selectedImage} onSelect={setSelectedImage} onUpload={handleUpload} onDelete={handleDelete} uploading={uploading} />
          )}
        </div>
      </div>
    </div>
  );
}
