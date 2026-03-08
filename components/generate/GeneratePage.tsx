"use client";

import { useState, useCallback, useEffect } from "react";
import type { Client, ReferenceImage } from "@/types/domain";
import { CreativeLibrary } from "./CreativeLibrary";

interface GeneratePageProps {
  clients: Client[];
}

export function GeneratePage({ clients }: GeneratePageProps) {
  const [clientId, setClientId] = useState<string>(clients[0]?.id ?? "");
  const [images, setImages] = useState<ReferenceImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<ReferenceImage | null>(
    null
  );
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingImages, setLoadingImages] = useState(false);

  // Fetch images for selected client
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

  // On client change
  const handleClientChange = useCallback(
    (newClientId: string) => {
      setClientId(newClientId);
      setSelectedImage(null);
      setOutputUrl(null);
      setError(null);
      fetchImages(newClientId);
    },
    [fetchImages]
  );

  // Load images on mount
  useEffect(() => {
    if (clientId) fetchImages(clientId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Upload image
  const handleUpload = useCallback(
    async (file: File) => {
      if (!clientId) return;
      setUploading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("clientId", clientId);
        formData.append("label", "identity");

        const res = await fetch("/api/generate/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }

        const data = await res.json();
        const newImage = data.image as ReferenceImage;
        setImages((prev) => [newImage, ...prev]);
        setSelectedImage(newImage);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [clientId]
  );

  // Delete image
  const handleDelete = useCallback(
    async (imageId: string) => {
      try {
        await fetch(`/api/references/${imageId}`, { method: "DELETE" });
        setImages((prev) => prev.filter((img) => img.id !== imageId));
        if (selectedImage?.id === imageId) setSelectedImage(null);
      } catch {
        // Silently fail
      }
    },
    [selectedImage]
  );

  // Generate
  const handleGenerate = useCallback(async () => {
    if (!selectedImage || !prompt.trim()) return;
    setGenerating(true);
    setError(null);
    setOutputUrl(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          prompt: prompt.trim(),
          referenceImageUrl: selectedImage.url,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }

      const data = await res.json();
      setOutputUrl(data.outputUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }, [clientId, selectedImage, prompt]);

  // Save output to library
  const handleSaveToLibrary = useCallback(async () => {
    if (!outputUrl || !clientId) return;
    try {
      const res = await fetch("/api/references", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          label: "identity",
          url: outputUrl,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setImages((prev) => [data.reference, ...prev]);
      }
    } catch {
      // Silently fail
    }
  }, [outputUrl, clientId]);

  const canGenerate = selectedImage && prompt.trim() && !generating;
  const clientName =
    clients.find((c) => c.id === clientId)?.name ?? "Client";

  return (
    <div className="gen-page">
      {/* Top bar */}
      <div className="gen-topbar">
        <div>
          <h1 className="gen-title">Generate</h1>
          <p className="gen-subtitle">
            Select a reference image, write a prompt, and generate new
            creatives
          </p>
        </div>
        <div className="gen-client-pill">
          <span className="gen-client-label">Client</span>
          <select
            value={clientId}
            onChange={(e) => handleClientChange(e.target.value)}
            className="gen-client-select"
          >
            {clients.length === 0 && (
              <option value="">No clients yet</option>
            )}
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="gen-error">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
          <button onClick={() => setError(null)}>Ã</button>
        </div>
      )}

      {/* Main two-column layout */}
      <div className="gen-layout">
        {/* Left: Controls */}
        <div className="gen-controls">
          {/* Step 1: Reference Image */}
          <div className="gen-card">
            <div className="gen-card-header">
              <span className="gen-step-badge">1</span>
              <h3>Reference Image</h3>
            </div>
            {selectedImage ? (
              <div className="gen-ref-preview">
                <img src={selectedImage.url} alt="Selected reference" />
                <div className="gen-ref-overlay">
                  <button
                    className="gen-ref-change"
                    onClick={() => setSelectedImage(null)}
                  >
                    Change Image
                  </button>
                </div>
              </div>
            ) : (
              <div className="gen-ref-empty">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <p>Click an image in the library to select it</p>
                <span>or upload a new one</span>
              </div>
            )}
          </div>

          {/* Step 2: Prompt */}
          <div className="gen-card">
            <div className="gen-card-header">
              <span className="gen-step-badge">2</span>
              <h3>Prompt</h3>
            </div>
            <textarea
              className="gen-prompt-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`Describe what you want to generate for ${clientName}...`}
              rows={5}
            />
            <div className="gen-prompt-hint">
              Be specific about setting, lighting, composition, and style.
            </div>
          </div>

          {/* Generate button */}
          <button
            className="gen-submit-btn"
            disabled={!canGenerate}
            onClick={handleGenerate}
          >
            {generating ? (
              <>
                <span className="gen-spinner" />
                Generating...
              </>
            ) : (
              <>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                Generate Creative
              </>
            )}
          </button>

          {!selectedImage && prompt.trim() && (
            <p className="gen-hint-text">
              Select a reference image from the library to enable generation.
            </p>
          )}

          {/* Output */}
          {outputUrl && (
            <div className="gen-card">
              <div className="gen-card-header">
                <span className="gen-step-badge gen-step-done">â</span>
                <h3>Generated Output</h3>
              </div>
              <div className="gen-output-image">
                <img src={outputUrl} alt="Generated output" />
              </div>
              <div className="gen-output-actions">
                <a
                  href={outputUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gen-action-btn"
                >
                  Open Full Size
                </a>
                <button
                  className="gen-action-btn gen-action-primary"
                  onClick={handleSaveToLibrary}
                >
                  Save to Library
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Library */}
        <div className="gen-library">
          {loadingImages ? (
            <div className="gen-loading">
              <span className="gen-spinner" />
              Loading images...
            </div>
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
