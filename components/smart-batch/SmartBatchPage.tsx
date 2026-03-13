"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Client, Profile, PromptPack } from "@/types/domain";

const MAX_PHOTOS = 5;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function SmartBatchPage({
  clients,
  profiles,
  promptPacks,
}: {
  clients: Client[];
  profiles: Profile[];
  promptPacks: PromptPack[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ———— State ————
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [aspect, setAspect] = useState("1:1");
  const [resolution, setResolution] = useState("2K");
  const [quantity, setQuantity] = useState(15);
  const [launching, setLaunching] = useState(false);
  const [clientProfileConfigured, setClientProfileConfigured] = useState(false);
  const [clientFormData, setClientFormData] = useState<Record<string, string> | null>(null);
  const [contentGenData, setContentGenData] = useState<Record<string, string> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reference photos
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Hidden defaults — still required by API
  const profileId = profiles[0]?.id ?? "";
  const promptPackId = promptPacks[0]?.id ?? "";

  // ———— Fetch client data ————
  useEffect(() => {
    if (!clientId) {
      setContentGenData(null);
      setClientProfileConfigured(false);
      setClientFormData(null);
      return;
    }
    (async () => {
      try {
        const resp = await fetch(`/api/clients/${clientId}`);
        if (!resp.ok) return;
        const { client } = await resp.json();
        const fd = client?.defaults?.formData;
        if (fd) {
          const allKeys = [
            "brandName","industry","targetAudience","brandVoice","brandValues",
            "competitivePosition","keyMessages","visualIdentity",
            "contentTypes","imageStyle","scenesAndSettings","modelPreferences",
            "propsAndProducts","moodAndLighting","compositionNotes","referenceExamples",
            "creativeStrategyGoals","brandAssets"
          ];
          const hasAnyField = allKeys.some(k => fd[k] && String(fd[k]).trim().length > 0);
          setClientProfileConfigured(hasAnyField);
          setClientFormData(hasAnyField ? fd : null);
          const gf: Record<string, string> = {};
          ["contentTypes","imageStyle","scenesAndSettings","modelPreferences","propsAndProducts","moodAndLighting","compositionNotes","referenceExamples"].forEach(k => { if (fd[k]) gf[k] = fd[k]; });
          setContentGenData(Object.keys(gf).length > 0 ? gf : null);
        } else {
          setContentGenData(null);
          setClientProfileConfigured(false);
          setClientFormData(null);
        }
      } catch {
        setContentGenData(null);
        setClientProfileConfigured(false);
        setClientFormData(null);
      }
    })();
  }, [clientId]);

  // Cleanup photo previews
  useEffect(() => {
    return () => { photos.forEach(p => URL.revokeObjectURL(p.preview)); };
  }, [photos]);

  // ———— Photo handlers ————
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null);
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => ACCEPTED_TYPES.includes(f.type));
    if (valid.length !== files.length) {
      setPhotoError("Some files were skipped — only JPG, PNG, WebP, and GIF are accepted.");
    }
    const remaining = MAX_PHOTOS - photos.length;
    if (valid.length > remaining) {
      setPhotoError(`Maximum ${MAX_PHOTOS} images allowed. Only ${remaining} more can be added.`);
      valid.splice(remaining);
    }
    const newPhotos = valid.map(f => ({ file: f, preview: URL.createObjectURL(f) }));
    setPhotos(prev => [...prev, ...newPhotos]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (idx: number) => {
    setPhotos(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[idx].preview);
      updated.splice(idx, 1);
      return updated;
    });
    setPhotoError(null);
  };

  // ———— Submit ————
  const canLaunch = clientId && profileId && promptPackId;

  const handleLaunch = async () => {
    if (!canLaunch || launching) return;
    setLaunching(true);
    setError(null);
    try {
      const res = await fetch("/api/smart-batch/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          profileId,
          promptPackId,
          briefText: "",
          additionalContext: "",
          useBrandContext: !!clientFormData,
          aspectRatio: aspect,
          resolution,
          quantity,
          referencePhotos: photos.length > 0 ? photos.map(p => p.file.name) : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/batch/${data.run.id}`);
      } else {
        const err = await res.json().catch(() => null);
        alert("Failed to create batch: " + (err?.error || "Unknown error"));
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLaunching(false);
    }
  };

  // ———— Render ————
  return (
    <div style={{ display: "grid", gap: 14 }}>

      {/* ── Client + Generator Status ── */}
      <div className="card" style={{ padding: "14px 18px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 12 }}>
          <div>
            <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>Client</label>
            <select className="form-select" value={clientId} onChange={e => setClientId(e.target.value)} style={{ padding: "6px 10px", fontSize: 13 }}>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {clientProfileConfigured ? (
              <>
                <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#4ade80" }} />
                <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Client Generator active</span>
                <a href="/client-generator" className="sb-setup-link" style={{ fontSize: 12 }}>Edit</a>
              </>
            ) : (
              <>
                <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#ffa026" }} />
                <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>No client profile</span>
                <a href="/client-generator" className="sb-setup-link" style={{ fontSize: 12 }}>Set up</a>
              </>
            )}
          </div>
        </div>
        <span style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 4, display: "block" }}>
          This is the brain used to build prompts from brand info.
        </span>
      </div>

      {/* ── Generation Settings ── */}
      <div className="card" style={{ padding: "14px 18px" }}>
        <h3 className="sb-section-title" style={{ fontSize: 14, marginBottom: 10 }}>Generation Settings</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>Aspect Ratio</label>
            <select className="form-select" value={aspect} onChange={e => setAspect(e.target.value)} style={{ padding: "6px 10px", fontSize: 13 }}>
              <option value="1:1">1:1</option>
              <option value="9:16">9:16</option>
            </select>
          </div>
          <div>
            <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>Resolution</label>
            <select className="form-select" value={resolution} onChange={e => setResolution(e.target.value)} style={{ padding: "6px 10px", fontSize: 13 }}>
              <option value="1K">1K</option>
              <option value="2K">2K</option>
              <option value="4K">4K</option>
            </select>
          </div>
          <div>
            <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>Quantity</label>
            <select className="form-select" value={quantity} onChange={e => setQuantity(Number(e.target.value))} style={{ padding: "6px 10px", fontSize: 13 }}>
              <option value={5}>5</option>
              <option value={15}>15</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Reference Photos ── */}
      <div className="card" style={{ padding: "14px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <h3 className="sb-section-title" style={{ fontSize: 14, margin: 0 }}>Reference Photos</h3>
          <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{photos.length}/{MAX_PHOTOS}</span>
        </div>
        <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "0 0 10px" }}>
          Upload up to 5 images to guide style/composition.
        </p>

        {/* Thumbnails */}
        {photos.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            {photos.map((p, i) => (
              <div key={i} style={{ position: "relative", width: 72, height: 72, borderRadius: 6, overflow: "hidden", border: "1px solid var(--color-border)" }}>
                <img src={p.preview} alt={`ref-${i}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button
                  onClick={() => removePhoto(i)}
                  style={{
                    position: "absolute", top: 2, right: 2,
                    width: 18, height: 18, borderRadius: "50%",
                    background: "rgba(0,0,0,0.7)", color: "#fff",
                    border: "none", cursor: "pointer", fontSize: 11,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    lineHeight: 1, padding: 0,
                  }}
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload button */}
        {photos.length < MAX_PHOTOS && (
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: "6px 14px", fontSize: 12,
              background: "var(--color-surface-elevated, #1e293b)",
              color: "var(--color-text-secondary)",
              border: "1px dashed var(--color-border)",
              borderRadius: 6, cursor: "pointer",
            }}
          >
            + Add images
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotoSelect}
          style={{ display: "none" }}
        />

        {photoError && (
          <p style={{ fontSize: 12, color: "#ffa026", margin: "6px 0 0" }}>{photoError}</p>
        )}
      </div>

      {/* ── Generate ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {error && <p style={{ color: "#ff4444", margin: 0, fontSize: 13, flex: 1 }}>{error}</p>}
        <button
          className="btn-primary"
          disabled={!canLaunch || launching}
          onClick={handleLaunch}
          style={{ marginLeft: "auto", padding: "8px 28px", fontSize: 14 }}
        >
          {launching ? "Creating Batch…" : "Generate Batch"}
        </button>
      </div>
    </div>
  );
}
