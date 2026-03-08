"use client";

import { useState, useRef, useCallback } from "react";
import type { UgcConcept, UgcVariant } from "@/types/ugc";
import { VariantCard } from "./VariantCard";
import { PricingPreview } from "./PricingPreview";

export function VariantLabTab({
  brandId,
  concepts,
  variants,
  onCreated,
}: {
  brandId: string;
  concepts: UgcConcept[];
  variants: UgcVariant[];
  onCreated: () => void;
}) {
  const [conceptId, setConceptId] = useState(concepts[0]?.id ?? "");
  const [kind, setKind] = useState<"image" | "video">("video");
  const [audioTier, setAudioTier] = useState("no_audio");
  const [duration, setDuration] = useState(5);
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const conceptVariants = variants.filter((v) => v.concept_id === conceptId);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("File too large. Max 10MB.");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setImageUrl(""); // Clear any previous URL
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadImage = async (): Promise<string | undefined> => {
    if (!imageFile) return imageUrl.trim() || undefined;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("brandId", brandId);
      const res = await fetch("/api/ugc/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }
      const data = await res.json();
      return data.url;
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Image upload failed. Please try again.");
      return undefined;
    } finally {
      setUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !conceptId) return;
    setGenerating(true);
    try {
      // Upload image first if a file was selected
      const resolvedImageUrl = await uploadImage();

      const endpoint = kind === "video" ? "/api/ugc/videos/generate" : "/api/ugc/variants";
      const body: Record<string, unknown> = {
        concept_id: conceptId,
        prompt: prompt.trim(),
        kind,
        audio_tier: audioTier,
        duration_sec: duration,
        aspect_ratio: aspectRatio,
      };
      if (resolvedImageUrl) body.image_url = resolvedImageUrl;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setPrompt("");
        removeImage();
        onCreated();
      }
    } catch (err) {
      console.error("Generation failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <div className="ugc-section-header">
        <h3>Video Lab</h3>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <label className="form-label">Concept</label>
            <select className="form-select" value={conceptId} onChange={(e) => setConceptId(e.target.value)}>
              {concepts.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
            <div>
              <label className="form-label">Type</label>
              <select className="form-select" value={kind} onChange={(e) => setKind(e.target.value as "image" | "video")}>
                <option value="video">Video</option>
                <option value="image">Image</option>
              </select>
            </div>
            {kind === "video" && (
              <>
                <div>
                  <label className="form-label">Audio Tier</label>
                  <select className="form-select" value={audioTier} onChange={(e) => setAudioTier(e.target.value)}>
                    <option value="no_audio">No Audio</option>
                    <option value="audio">Native Audio</option>
                    <option value="audio_voice">Audio + Voice</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Duration</label>
                  <select className="form-select" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                    <option value={5}>5 seconds</option>
                    <option value={10}>10 seconds</option>
                  </select>
                </div>
              </>
            )}
            <div>
              <label className="form-label">Aspect Ratio</label>
              <select className="form-select" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
                <option value="16:9">16:9 (Landscape)</option>
                <option value="9:16">9:16 (Portrait)</option>
                <option value="1:1">1:1 (Square)</option>
              </select>
            </div>
          </div>

          {kind === "video" && (
            <PricingPreview duration={duration} audioTier={audioTier} />
          )}

          {/* Drag-and-drop image upload */}
          <div>
            <label className="form-label">Reference Image (optional)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />

            {imagePreview ? (
              <div className="ugc-upload-preview">
                <img
                  src={imagePreview}
                  alt="Reference"
                  style={{
                    maxHeight: 200,
                    maxWidth: "100%",
                    objectFit: "contain",
                    borderRadius: 8,
                  }}
                />
                <button
                  className="ugc-upload-remove"
                  onClick={removeImage}
                  title="Remove image"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div
                className={`ugc-upload-dropzone ${dragOver ? "ugc-upload-dragover" : ""}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="ugc-upload-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <p className="ugc-upload-text">
                  Drag & drop an image here, or <span className="ugc-upload-link">browse files</span>
                </p>
                <p className="ugc-upload-hint">PNG, JPG, WEBP up to 10MB</p>
              </div>
            )}
          </div>

          <div>
            <label className="form-label">Prompt</label>
            <textarea
              className="form-input"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the video/image you want to generate..."
            />
          </div>

          <button
            className="button button-primary"
            onClick={handleGenerate}
            disabled={generating || uploading || !prompt.trim() || !conceptId}
          >
            {uploading
              ? "Uploading image..."
              : generating
              ? "Generating..."
              : `Generate ${kind === "video" ? "Video" : "Image"}`}
          </button>
        </div>
      </div>

      <h4 style={{ marginBottom: 12, color: "var(--color-text-secondary)" }}>
        Variants for selected concept ({conceptVariants.length})
      </h4>

      {conceptVariants.length === 0 ? (
        <div className="ugc-empty-state">No variants yet. Generate your first one above.</div>
      ) : (
        <div className="variant-grid">
          {conceptVariants.map((v) => (
            <VariantCard
              key={v.id}
              variant={v}
              onPreview={() => setPreviewUrl(v.output_url)}
            />
          ))}
        </div>
      )}

      {/* Preview modal */}
      {previewUrl && (
        <div className="ugc-modal-backdrop" onClick={() => setPreviewUrl(null)}>
          <div className="ugc-modal" onClick={(e) => e.stopPropagation()}>
            <button className="ugc-modal-close" onClick={() => setPreviewUrl(null)}>✕</button>
            {previewUrl.includes(".mp4") || previewUrl.includes("video") ? (
              <video src={previewUrl} controls autoPlay style={{ maxWidth: "100%", borderRadius: 8 }} />
            ) : (
              <img src={previewUrl} alt="Preview" style={{ maxWidth: "100%", borderRadius: 8 }} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
