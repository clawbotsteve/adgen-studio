"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Client, Profile, BrandContext } from "@/types/domain";

export function SmartBatchPage({
  clients,
  profiles,
}: {
  clients: Client[];
  profiles: Profile[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const briefInputRef = useRef<HTMLInputElement>(null);

  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [profileId, setProfileId] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [resolution, setResolution] = useState("2K");
  const [quantity, setQuantity] = useState(5);
  const [brandContext, setBrandContext] = useState<BrandContext | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [referenceImages, setReferenceImages] = useState<
    { file: File; preview: string }[]
  >([]);
  const [deleting, setDeleting] = useState(false);
  const [selectedAngles, setSelectedAngles] = useState<string[]>([]);
  const [lockAngles, setLockAngles] = useState(false);

  // New: PDP links
  const [pdpLinks, setPdpLinks] = useState<string[]>([]);
  const [pdpInput, setPdpInput] = useState("");

  // New: Creative briefs
  const [briefs, setBriefs] = useState<{ file: File; name: string }[]>([]);

  // New: General context
  const [generalContext, setGeneralContext] = useState("");

  const handleDeleteClient = async () => {
    if (!clientId) return;
    if (!deleting) {
      setDeleting(true);
      return;
    }
    try {
      const res = await fetch("/api/clients/" + clientId, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      window.location.reload();
    } catch {
      alert("Failed to delete client");
    }
    setDeleting(false);
  };

  // Set initial profile
  useEffect(() => {
    if (profiles.length > 0 && !profileId) setProfileId(profiles[0].id);
  }, [profiles, profileId]);

  // Fetch brand context when client changes
  const fetchBrandContext = useCallback(async (cid: string) => {
    setContextLoading(true);
    try {
      const res = await fetch(`/api/brand-context?clientId=${cid}`);
      const data = await res.json();
      if (data.context) {
        setBrandContext(data.context);
      } else {
        const clientRes = await fetch(`/api/clients`);
        const clientsData = await clientRes.json();
        const client = Array.isArray(clientsData)
          ? clientsData.find((c: { id: string }) => c.id === cid)
          : null;
        const hasFormData =
          client?.defaults?.formData &&
          typeof client.defaults.formData === "object" &&
          Object.values(client.defaults.formData).some(
            (v: unknown) => typeof v === "string" && (v as string).trim().length > 0
          );
        setBrandContext(hasFormData ? ({ id: "formData" } as BrandContext) : null);
      }
    } catch {
      setBrandContext(null);
    } finally {
      setContextLoading(false);
    }
  }, []);

  useEffect(() => {
    if (clientId) fetchBrandContext(clientId);
  }, [clientId, fetchBrandContext]);

  const selectedProfile = profiles.find((p) => p.id === profileId);
  const selectedClient = clients.find((c) => c.id === clientId);
  const canLaunch = clientId && profileId;

  const handleLaunch = async () => {
    if (!canLaunch) return;
    setLaunching(true);
    try {
      const res = await fetch("/api/smart-batch/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          profileId,
          aspectRatio,
          resolution,
          quantity,
          selectedAngles,
          lockAngles,
          pdpLinks,
          generalContext,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/batch/${data.run.id}`);
      } else {
        const err = await res.json().catch(() => null);
        alert("Failed to create batch: " + (err?.error || "Unknown error"));
      }
    } catch {
      alert("Failed to create batch. Please try again.");
    } finally {
      setLaunching(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remaining = 5 - referenceImages.length;
    const newFiles = Array.from(files).slice(0, remaining);
    const newImages = newFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setReferenceImages((prev) => [...prev, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (idx: number) => {
    setReferenceImages((prev) => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[idx].preview);
      copy.splice(idx, 1);
      return copy;
    });
  };

  // PDP link handlers
  const addPdpLink = () => {
    const url = pdpInput.trim();
    if (!url) return;
    if (pdpLinks.includes(url)) return;
    setPdpLinks((prev) => [...prev, url]);
    setPdpInput("");
  };

  const removePdpLink = (idx: number) => {
    setPdpLinks((prev) => prev.filter((_, i) => i !== idx));
  };

  // Brief handlers
  const handleBriefSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const accepted = Array.from(files).filter((f) => {
      const name = f.name.toLowerCase();
      return name.endsWith(".pdf") || name.endsWith(".txt");
    });
    const newBriefs = accepted.map((f) => ({ file: f, name: f.name }));
    setBriefs((prev) => [...prev, ...newBriefs]);
    if (briefInputRef.current) briefInputRef.current.value = "";
  };

  const removeBrief = (idx: number) => {
    setBriefs((prev) => prev.filter((_, i) => i !== idx));
  };

  const contextActive = brandContext && !contextLoading;

  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 900 }}>
      {/* Row 1: Client */}
      <div className="card" style={{ padding: "12px 16px" }}>
        <div>
          <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>
            Client
          </label>
          <select
            className="form-select"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            style={{ padding: "6px 10px", fontSize: 13 }}
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {clientId && (
            <button
              type="button"
              onClick={handleDeleteClient}
              style={{
                marginLeft: 8,
                padding: "4px 10px",
                fontSize: 12,
                background: deleting ? "#dc2626" : "transparent",
                color: deleting ? "#fff" : "#ef4444",
                border: "1px solid #ef4444",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              {deleting ? "Confirm Delete?" : "\u00D7"}
            </button>
          )}
        </div>

        {selectedClient?.description && (
          <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: "6px 0 0" }}>
            {selectedClient.description}
          </p>
        )}
        {contextActive && (
          <p style={{ fontSize: 11, color: "var(--color-success, #22c55e)", margin: "4px 0 0" }}>
            Brand context loaded {"\u2014"} prompts will be generated from client data
          </p>
        )}
        {!contextActive && !contextLoading && clientId && (
          <p style={{ fontSize: 11, color: "var(--color-warning, #f59e0b)", margin: "4px 0 0" }}>
            No brand context found {"\u2014"} complete Client Generator first for best results
          </p>
        )}
      </div>

      {/* Ad Angle Selection */}
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 8,
          padding: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "rgba(255,255,255,0.7)",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Ad Angles{" "}
            <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
          </label>
          {selectedAngles.length > 0 && (
            <label
              style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.6)", cursor: "pointer" }}
            >
              <input
                type="checkbox"
                checked={lockAngles}
                onChange={(e) => setLockAngles(e.target.checked)}
              />
              Lock to selected only
            </label>
          )}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {[
            { key: "us_vs_them", label: "US vs Them" },
            { key: "key_feature", label: "Key Feature" },
            { key: "testimonial_review", label: "Testimonial/Review" },
            { key: "bundle_offer", label: "Bundle/Offer" },
          ].map((angle) => {
            const isSelected = selectedAngles.includes(angle.key);
            return (
              <button
                key={angle.key}
                type="button"
                onClick={() => {
                  setSelectedAngles((prev) =>
                    isSelected ? prev.filter((a) => a !== angle.key) : [...prev, angle.key]
                  );
                }}
                style={{
                  padding: "6px 14px",
                  fontSize: 12,
                  borderRadius: 20,
                  border: isSelected ? "1px solid #6366f1" : "1px solid rgba(255,255,255,0.15)",
                  background: isSelected ? "rgba(99,102,241,0.2)" : "transparent",
                  color: isSelected ? "#a5b4fc" : "rgba(255,255,255,0.6)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {angle.label}
              </button>
            );
          })}
        </div>
        {selectedAngles.length === 0 && (
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 6, marginBottom: 0 }}>
            No angles selected {"\u2014"} auto-mix will distribute across all 4 categories for variety.
          </p>
        )}
      </div>

      {/* Row 2: Generation Settings */}
      <div className="card" style={{ padding: "12px 16px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
            gap: 10,
            alignItems: "end",
          }}
        >
          <div>
            <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>
              Profile
            </label>
            <select
              className="form-select"
              value={profileId}
              onChange={(e) => setProfileId(e.target.value)}
              style={{ padding: "6px 10px", fontSize: 13 }}
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>
              Aspect Ratio
            </label>
            <select
              className="form-select"
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              style={{ padding: "6px 10px", fontSize: 13 }}
            >
              <option value="1:1">1:1</option>
              <option value="9:16">9:16</option>
              <option value="16:9">16:9</option>
            </select>
          </div>
          <div>
            <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>
              Resolution
            </label>
            <select
              className="form-select"
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              style={{ padding: "6px 10px", fontSize: 13 }}
            >
              <option value="1K">1K</option>
              <option value="2K">2K</option>
              <option value="4K">4K</option>
            </select>
          </div>
          <div>
            <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>
              Quantity
            </label>
            <select
              className="form-select"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              style={{ padding: "6px 10px", fontSize: 13 }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <span
              style={{
                fontSize: 11,
                color: "var(--color-text-secondary)",
                padding: "8px 0",
              }}
            >
              {selectedProfile
                ? `${selectedProfile.mode} \u00B7 ${selectedProfile.aspect_ratio} \u00B7 ${selectedProfile.resolution}`
                : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Row 3: Reference Images */}
      <div className="card" style={{ padding: "12px 16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: referenceImages.length > 0 ? 10 : 0,
          }}
        >
          <label className="form-label" style={{ margin: 0, fontSize: 12 }}>
            Reference Images{" "}
            <span style={{ color: "var(--color-text-secondary)", fontWeight: 400 }}>
              (optional, max 5)
            </span>
          </label>
          {referenceImages.length < 5 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: "var(--color-primary, #6366f1)",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "5px 12px",
                fontSize: 12,
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              + Add Images
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
        </div>
        {referenceImages.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {referenceImages.map((img, idx) => (
              <div
                key={idx}
                style={{
                  position: "relative",
                  width: 72,
                  height: 72,
                  borderRadius: 6,
                  overflow: "hidden",
                  border: "1px solid var(--color-border)",
                }}
              >
                <img
                  src={img.preview}
                  alt={`ref-${idx}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <button
                  onClick={() => removeImage(idx)}
                  style={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    background: "rgba(0,0,0,0.7)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: 18,
                    height: 18,
                    fontSize: 11,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1,
                  }}
                >
                  x
                </button>
              </div>
            ))}
          </div>
        )}
        {referenceImages.length === 0 && (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: "1px dashed var(--color-border)",
              borderRadius: 6,
              padding: "14px 0",
              textAlign: "center",
              cursor: "pointer",
              color: "var(--color-text-secondary)",
              fontSize: 12,
            }}
          >
            Click to upload reference images or drag & drop
          </div>
        )}
      </div>

      {/* NEW: Product Links (PDP) */}
      <div className="card" style={{ padding: "12px 16px" }}>
        <label className="form-label" style={{ marginBottom: 8, fontSize: 12 }}>
          Product Links (PDP){" "}
          <span style={{ color: "var(--color-text-secondary)", fontWeight: 400 }}>
            (optional)
          </span>
          {pdpLinks.length > 0 && (
            <span
              style={{
                marginLeft: 8,
                fontSize: 11,
                background: "rgba(99,102,241,0.2)",
                color: "#a5b4fc",
                padding: "2px 8px",
                borderRadius: 10,
              }}
            >
              {pdpLinks.length} link{pdpLinks.length !== 1 ? "s" : ""}
            </span>
          )}
        </label>
        <div style={{ display: "flex", gap: 8, marginBottom: pdpLinks.length > 0 ? 10 : 0 }}>
          <input
            type="url"
            value={pdpInput}
            onChange={(e) => setPdpInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addPdpLink();
              }
            }}
            placeholder="https://brand.com/product-page"
            style={{
              flex: 1,
              padding: "7px 12px",
              fontSize: 13,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 6,
              color: "rgba(255,255,255,0.9)",
              outline: "none",
            }}
          />
          <button
            onClick={addPdpLink}
            disabled={!pdpInput.trim()}
            style={{
              padding: "7px 16px",
              fontSize: 12,
              fontWeight: 600,
              background: pdpInput.trim() ? "#6366f1" : "rgba(99,102,241,0.3)",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: pdpInput.trim() ? "pointer" : "default",
            }}
          >
            Add
          </button>
        </div>
        {pdpLinks.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {pdpLinks.map((url, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 6,
                  padding: "6px 10px",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.7)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "calc(100% - 30px)",
                  }}
                >
                  {url}
                </span>
                <button
                  onClick={() => removePdpLink(idx)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#ef4444",
                    cursor: "pointer",
                    fontSize: 14,
                    padding: "0 4px",
                  }}
                >
                  {"\u00D7"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* NEW: Creative Brief Upload */}
      <div className="card" style={{ padding: "12px 16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: briefs.length > 0 ? 10 : 0,
          }}
        >
          <label className="form-label" style={{ margin: 0, fontSize: 12 }}>
            Creative Brief{" "}
            <span style={{ color: "var(--color-text-secondary)", fontWeight: 400 }}>
              (optional, .pdf / .txt)
            </span>
          </label>
          <button
            onClick={() => briefInputRef.current?.click()}
            style={{
              background: "var(--color-primary, #6366f1)",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "5px 12px",
              fontSize: 12,
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            + Upload Brief
          </button>
          <input
            ref={briefInputRef}
            type="file"
            accept=".pdf,.txt"
            multiple
            onChange={handleBriefSelect}
            style={{ display: "none" }}
          />
        </div>
        {briefs.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {briefs.map((b, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 6,
                  padding: "5px 10px",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                <span style={{ fontSize: 14 }}>
                  {b.name.endsWith(".pdf") ? "\uD83D\uDCC4" : "\uD83D\uDCDD"}
                </span>
                {b.name}
                <button
                  onClick={() => removeBrief(idx)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#ef4444",
                    cursor: "pointer",
                    fontSize: 13,
                    padding: 0,
                    marginLeft: 2,
                  }}
                >
                  {"\u00D7"}
                </button>
              </div>
            ))}
          </div>
        )}
        {briefs.length === 0 && (
          <div
            onClick={() => briefInputRef.current?.click()}
            style={{
              border: "1px dashed var(--color-border)",
              borderRadius: 6,
              padding: "14px 0",
              textAlign: "center",
              cursor: "pointer",
              color: "var(--color-text-secondary)",
              fontSize: 12,
            }}
          >
            Upload a creative brief (.pdf or .txt)
          </div>
        )}
      </div>

      {/* NEW: General Context */}
      <div className="card" style={{ padding: "12px 16px" }}>
        <label className="form-label" style={{ marginBottom: 6, fontSize: 12 }}>
          General Context{" "}
          <span style={{ color: "var(--color-text-secondary)", fontWeight: 400 }}>
            (optional)
          </span>
        </label>
        <textarea
          value={generalContext}
          onChange={(e) => setGeneralContext(e.target.value)}
          placeholder="Add any freeform context, notes, or direction for this batch..."
          rows={4}
          style={{
            width: "100%",
            padding: "10px 12px",
            fontSize: 13,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 6,
            color: "rgba(255,255,255,0.9)",
            resize: "vertical",
            outline: "none",
            fontFamily: "inherit",
            lineHeight: 1.5,
          }}
        />
      </div>

      {/* Row 4: Launch bar */}
      <div
        className="card"
        style={{
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{quantity} images</span>
          <span
            style={{
              fontSize: 12,
              color: "var(--color-text-secondary)",
              marginLeft: 8,
            }}
          >
            {contextActive ? "Brand context active" : "No brand context"}
            {referenceImages.length > 0
              ? ` \u00B7 ${referenceImages.length} ref image${referenceImages.length > 1 ? "s" : ""}`
              : ""}
            {pdpLinks.length > 0
              ? ` \u00B7 ${pdpLinks.length} PDP link${pdpLinks.length > 1 ? "s" : ""}`
              : ""}
            {briefs.length > 0
              ? ` \u00B7 ${briefs.length} brief${briefs.length > 1 ? "s" : ""}`
              : ""}
          </span>
        </div>
        <button
          className="button button-primary"
          onClick={handleLaunch}
          disabled={!canLaunch || launching}
          style={{ minWidth: 140, padding: "8px 20px", fontSize: 13 }}
        >
          {launching ? "Generating..." : "Generate Batch"}
        </button>
      </div>
    </div>
  );
}
