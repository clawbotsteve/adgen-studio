"use client";


  // Sync local clients list with prop
  useEffect(() => {
    setClientsList(clients);
  }, [clients]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setClientDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDeleteClient = async (id: string, name: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      return;
    }
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setClientsList((prev) => prev.filter((c) => c.id !== id));
      if (clientId === id) setClientId("");
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Failed to delete client:", err);
      setDeleteConfirm(null);
    }
  };


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
  const [clientsList, setClientsList] = useState(clients);
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
    { file: File; preview: string }[]
  >([]);

  // Set initial profile
  useEffect(() => {
    if (profiles.length > 0 && !profileId) setProfileId(profiles[0].id);
  }, [profiles]);

  // Fetch brand context when client changes
  // Check both brand_context table and clients.defaults.formData
  const fetchBrandContext = useCallback(async (cid: string) => {
    setContextLoading(true);
    try {
      const res = await fetch(`/api/brand-context?clientId=${cid}`);
      const data = await res.json();
      if (data.context) {
        setBrandContext(data.context);
      } else {
        // Fallback: check if client has formData in defaults
        const clientRes = await fetch(`/api/clients`);
        const clientsData = await clientRes.json();
        const client = Array.isArray(clientsData)
          ? clientsData.find((c: { id: string }) => c.id === cid)
          : null;
        const hasFormData =
          client?.defaults?.formData &&
          typeof client.defaults.formData === "object" &&
          Object.values(client.defaults.formData).some(
            (v: unknown) => typeof v === "string" && v.trim().length > 0
          );
        // Set a minimal truthy object so context indicator shows green
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
  const selectedClient = clientsList.find((c) => c.id === clientId);

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

  const contextActive = brandContext && !contextLoading;

  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 900 }}>
      {/* Row 1: Client */}
      <div
        className="card"
        style={{ padding: "12px 16px" }}
      >
        <div>
          <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>
            Client
          </label>
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <div
              className="form-select"
              onClick={() => setClientDropdownOpen(!clientDropdownOpen)}
              style={{
                padding: "6px 10px",
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>{clientsList.find((c) => c.id === clientId)?.name || "Select a client"}</span>
              <span style={{ fontSize: 10, opacity: 0.6 }}>{clientDropdownOpen ? "\u25B2" : "\u25BC"}</span>
            </div>
            {clientDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  background: "#1a1a2e",
                  border: "1px solid #333",
                  borderRadius: 6,
                  maxHeight: 240,
                  overflowY: "auto",
                  marginTop: 2,
                }}
              >
                {clientsList.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      cursor: "pointer",
                      background: c.id === clientId ? "#2a2a4e" : "transparent",
                      borderBottom: "1px solid #222",
                    }}
                  >
                    <span
                      onClick={() => { setClientId(c.id); setClientDropdownOpen(false); setDeleteConfirm(null); }}
                      style={{ flex: 1, fontSize: 13, color: "#e0e0e0" }}
                    >
                      {c.id === clientId && "\u2713 "}{c.name}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteClient(c.id, c.name); }}
                      title={deleteConfirm === c.id ? "Click again to confirm" : "Delete client"}
                      style={{
                        background: deleteConfirm === c.id ? "#dc2626" : "transparent",
                        border: deleteConfirm === c.id ? "1px solid #dc2626" : "1px solid #555",
                        color: deleteConfirm === c.id ? "#fff" : "#888",
                        borderRadius: 4,
                        padding: "2px 6px",
                        fontSize: 11,
                        cursor: "pointer",
                        marginLeft: 8,
                        transition: "all 0.15s",
                      }}
                    >
                      {deleteConfirm === c.id ? "Confirm?" : "\u2715"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {selectedClient?.description && (
          <p
            style={{
              fontSize: 11,
              color: "var(--color-text-secondary)",
              margin: "6px 0 0",
            }}
          >
            {selectedClient.description}
          </p>
        )}
        {contextActive && (
          <p
            style={{
              fontSize: 11,
              color: "var(--color-success, #22c55e)",
              margin: "4px 0 0",
            }}
          >
            Brand context loaded Ã¢ÂÂ prompts will be generated from client data
          </p>
        )}
        {!contextActive && !contextLoading && clientId && (
          <p
            style={{
              fontSize: 11,
              color: "var(--color-warning, #f59e0b)",
              margin: "4px 0 0",
            }}
          >
            No brand context found Ã¢ÂÂ complete Client Generator first for best results
          </p>
        )}
      </div>

      {/* Row 2: Generation Settings Ã¢ÂÂ all in one tight row */}
      <div
        className="card"
        style={{ padding: "12px 16px" }}
      >
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
                ? `${selectedProfile.mode} ÃÂ· ${selectedProfile.aspect_ratio} ÃÂ· ${selectedProfile.resolution}`
                : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Row 3: Reference Images */}
      <div
        className="card"
        style={{ padding: "12px 16px" }}
      >
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
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
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
          <span style={{ fontWeight: 600, fontSize: 14 }}>
            {quantity} images
          </span>
          <span
            style={{
              fontSize: 12,
              color: "var(--color-text-secondary)",
              marginLeft: 8,
            }}
          >
            {contextActive ? "Brand context active" : "No brand context"}
            {referenceImages.length > 0
              ? ` ÃÂ· ${referenceImages.length} ref image${referenceImages.length > 1 ? "s" : ""}`
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
