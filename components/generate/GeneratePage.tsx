"use client";

import { useState, useCallback } from "react";
import type { Client, ReferenceImage } from "@/types/domain";
import { CreativeLibrary } from "./CreativeLibrary";

interface GeneratePageProps {
  clients: Client[];
}

export function GeneratePage({ clients }: GeneratePageProps) {
  const [clientId, setClientId] = useState<string>(clients[0]?.id ?? "");
  const [images, setImages] = useState<ReferenceImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<ReferenceImage | null>(null);
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

  // Load images on mount for the initial client
  useState(() => {
    if (clientId) fetchImages(clientId);
  });

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

  return (
    <div className="generate-page">
      {/* Header */}
      <div className="generate-header">
        <h1>Generate</h1>
        <div className="generate-client-select">
          <label htmlFor="client-select">Client:</label>
          <select
            id="client-select"
            value={clientId}
            onChange={(e) => handleClientChange(e.target.value)}
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
        <div className="generate-error">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Main content: library + panel */}
      <div className="generate-content">
        {/* Left: Creative Library */}
        <div className="generate-library-section">
          {loadingImages ? (
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

        {/* Right: Generate Panel */}
        <div className="generate-panel">
          {/* Selected image preview */}
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

          {/* Prompt input */}
          <div className="generate-prompt">
            <label htmlFor="prompt-input">Prompt</label>
            <textarea
              id="prompt-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to generate..."
              rows={4}
            />
          </div>

          {/* Generate button */}
          <button
            className="btn btn-primary btn-generate"
            disabled={!canGenerate}
            onClick={handleGenerate}
          >
            {generating ? (
              <>
                <span className="btn-spinner" /> Generating...
              </>
            ) : (
              "Generate"
            )}
          </button>

          {/* Output */}
          {outputUrl && (
            <div className="generate-output">
              <label>Generated Image</label>
              <img src={outputUrl} alt="Generated output" />
              <div className="generate-output-actions">
                <a
                  href={outputUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-secondary"
                >
                  Open Full Size
                </a>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={handleSaveToLibrary}
                >
                  Save to Library
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
