"use client";

import { useState } from "react";
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
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const conceptVariants = variants.filter((v) => v.concept_id === conceptId);

  const handleGenerate = async () => {
    if (!prompt.trim() || !conceptId) return;
    setGenerating(true);
    try {
      const endpoint = kind === "video" ? "/api/ugc/videos/generate" : "/api/ugc/variants";
      const body: Record<string, unknown> = {
        concept_id: conceptId,
        prompt: prompt.trim(),
        kind,
        audio_tier: audioTier,
        duration_sec: duration,
        aspect_ratio: aspectRatio,
      };
      if (imageUrl.trim()) body.image_url = imageUrl.trim();

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setPrompt("");
        setImageUrl("");
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
        <h3>Variant Lab</h3>
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
                    <option value="no_audio">No Audio ($0.07/s)</option>
                    <option value="audio">Native Audio ($0.14/s)</option>
                    <option value="audio_voice">Audio + Voice ($0.168/s)</option>
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

          <div>
            <label className="form-label">Reference Image URL (optional)</label>
            <input
              className="form-input"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
            />
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
            disabled={generating || !prompt.trim() || !conceptId}
          >
            {generating ? "Generating..." : `Generate ${kind === "video" ? "Video" : "Image"}`}
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
