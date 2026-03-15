"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Client } from "@/types/domain";
import { DEFAULT_PROMPTS } from "@/lib/constants/defaultPrompts";

interface TopCreativeItem {
  id: string;
  url: string;
  file_size_bytes: number | null;
  created_at: string;
}

const ANGLE_LABELS: Record<string, string> = {
  us_vs_them: "Us vs Them",
  key_feature: "Key Feature",
  testimonial_review: "Testimonial / Review",
  bundle_offer: "Bundle / Offer",
};

const VISUAL_STYLE_OPTIONS = [
  "Clean & Minimal",
  "Bold & Vibrant",
  "Editorial / Magazine",
  "Dark & Moody",
  "Bright & Airy",
  "Luxury / Premium",
  "Playful & Fun",
  "Natural & Organic",
  "Urban / Street",
  "Retro / Vintage",
];

export function ClientGeneratorPage({
  initialClients,
}: {
  initialClients: Client[];
}) {
  // ── Client selection ──
  const [clients, setClients] = useState(initialClients);
  const [selectedClientId, setSelectedClientId] = useState(
    initialClients[0]?.id ?? ""
  );
  const [newClientName, setNewClientName] = useState("");
  const [creatingClient, setCreatingClient] = useState(false);

  // ── Website Scan ──
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [scanStatus, setScanStatus] = useState<"idle" | "scanning" | "complete">("idle");
  const [scanStep, setScanStep] = useState("");

  // ── Form fields ──
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [usp, setUsp] = useState("");
  const [brandColors, setBrandColors] = useState("");
  const [visualStyle, setVisualStyle] = useState("");
  const [moodTone, setMoodTone] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [moreOfThis, setMoreOfThis] = useState("");
  const [lessOfThat, setLessOfThat] = useState("");

  // ── Color Swatches ──
  const [colorSwatches, setColorSwatches] = useState<{ hex: string; label: string }[]>([]);
  const [newColorHex, setNewColorHex] = useState("#6366f1");

  // ── Font Chooser ──
  const [selectedFont, setSelectedFont] = useState("");
  const [customFont, setCustomFont] = useState("");

  // ── Top Creatives ──
  const [topCreatives, setTopCreatives] = useState<TopCreativeItem[]>([]);
  const [tcUploading, setTcUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Prompts dropdown ──
  const [promptsOpen, setPromptsOpen] = useState(false);

  // ── Save state ──
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // ── Curated prompts grouped by angle ──
  const promptsByAngle = DEFAULT_PROMPTS.reduce<
    Record<string, typeof DEFAULT_PROMPTS>
  >((acc, p) => {
    if (!acc[p.angle]) acc[p.angle] = [];
    acc[p.angle].push(p);
    return acc;
  }, {});

  // ── Load client data ──
  const loadClientData = useCallback(async (clientId: string) => {
    if (!clientId) return;
    try {
      const res = await fetch("/api/clients/" + clientId);
      const data = await res.json();
      const client = data.client;
      const fd = client?.defaults?.formData || {};
      setProductName(fd.productName || "");
      setProductDescription(fd.productDescription || "");
      setUsp(fd.usp || "");
      setBrandColors(fd.brandColors || "");
      setVisualStyle(fd.visualStyle || "");
      setMoodTone(fd.moodTone || "");
      setTargetAudience(fd.targetAudience || "");
      setMoreOfThis(fd.moreOfThis || fd.voiceMoreOf || "");
      setLessOfThat(fd.lessOfThat || fd.voiceLessOf || "");
      if (fd.colorSwatches && Array.isArray(fd.colorSwatches)) setColorSwatches(fd.colorSwatches);
      if (fd.selectedFont) setSelectedFont(fd.selectedFont);
      if (fd.websiteUrl) setWebsiteUrl(fd.websiteUrl);
    } catch (e) {
      console.error("Failed to load client:", e);
    }

    // Load top creatives
    try {
      const tcRes = await fetch("/api/top-creatives?clientId=" + clientId);
      const tcData = await tcRes.json();
      setTopCreatives(
        Array.isArray(tcData.creatives) ? tcData.creatives : []
      );
    } catch {
      setTopCreatives([]);
    }
  }, []);

  useEffect(() => {
    if (selectedClientId) loadClientData(selectedClientId);
  }, [selectedClientId, loadClientData]);

  // ── Save form data ──
  const handleSave = async () => {
    if (!selectedClientId) return;
    setSaving(true);
    try {
      // Get current defaults first to preserve other data
      const getRes = await fetch("/api/clients/" + selectedClientId);
      const getData = await getRes.json();
      const currentDefaults = getData.client?.defaults || {};

      const newDefaults = {
        ...currentDefaults,
        formData: {
          productName,
          productDescription,
          usp,
          brandColors,
          visualStyle,
          moodTone,
          targetAudience,
          moreOfThis,
          lessOfThat,
          colorSwatches,
          selectedFont: customFont.trim() || selectedFont,
          websiteUrl,
        },
      };

      await fetch("/api/clients/" + selectedClientId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaults: newDefaults }),
      });

      // Also save to brand_context for backward compat with process route
      await fetch("/api/brand-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClientId,
          brand_guidelines: [
            moodTone,
            moreOfThis ? "More of: " + moreOfThis : "",
            lessOfThat ? "Less of: " + lessOfThat : "",
          ]
            .filter(Boolean)
            .join("\n"),
          products: [
            productName,
            productDescription,
            usp ? "USP: " + usp : "",
          ]
            .filter(Boolean)
            .join("\n"),
          customer_personas: targetAudience,
        }),
      });

      setLastSaved(new Date().toLocaleTimeString());
    } catch (e) {
      console.error("Save failed:", e);
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Create client ──
  const handleCreateClient = async () => {
    if (!newClientName.trim()) return;
    setCreatingClient(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newClientName.trim() }),
      });
      const data = await res.json();
      if (data.client) {
        setClients((prev) => [data.client, ...prev]);
        setSelectedClientId(data.client.id);
        setNewClientName("");
      }
    } catch {
      alert("Failed to create client");
    } finally {
      setCreatingClient(false);
    }
  };

  // ── Upload top creative ──
  const handleUploadCreative = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || !selectedClientId) return;
    setTcUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("clientId", selectedClientId);
        const res = await fetch("/api/top-creatives/upload", {
          method: "POST",
          body: fd,
        });
        if (res.ok) {
          const creative = await res.json();
          setTopCreatives((prev) => [...prev, creative]);
        }
      }
    } catch {
      alert("Upload failed");
    } finally {
      setTcUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Delete top creative ──
  const handleDeleteCreative = async (id: string) => {
    try {
      await fetch("/api/top-creatives/" + id, { method: "DELETE" });
      setTopCreatives((prev) => prev.filter((tc) => tc.id !== id));
    } catch {
      alert("Failed to delete");
    }
  };

  // ── Website Scan ──
  const handleScanWebsite = async () => {
    if (!websiteUrl.trim()) return;
    setScanStatus("scanning");
    setScanStep("Researching brand...");
    try {
      setTimeout(() => setScanStep("Extracting brand assets..."), 2000);
      const res = await fetch("/api/client-generator/scan-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: websiteUrl.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setScanStep("Populating fields...");
        if (data.productName) setProductName(data.productName);
        if (data.productDescription) setProductDescription(data.productDescription);
        if (data.usp) setUsp(data.usp);
        if (data.moodTone) setMoodTone(data.moodTone);
        if (data.targetAudience) setTargetAudience(data.targetAudience);
        if (data.brandColors) setBrandColors(data.brandColors);
        if (data.visualStyle) setVisualStyle(data.visualStyle);
        if (data.colors && Array.isArray(data.colors)) {
          setColorSwatches(data.colors);
        }
        if (data.font) setSelectedFont(data.font);
        setScanStatus("complete");
        setScanStep("Scan complete");
      } else {
        alert("Scan failed. Please try again.");
        setScanStatus("idle");
        setScanStep("");
      }
    } catch {
      alert("Scan failed. Please try again.");
      setScanStatus("idle");
      setScanStep("");
    }
  };

  // ── Color swatch helpers ──
  const addColorSwatch = () => {
    if (colorSwatches.some((c) => c.hex.toLowerCase() === newColorHex.toLowerCase())) return;
    setColorSwatches((prev) => [...prev, { hex: newColorHex, label: "" }]);
  };

  const removeColorSwatch = (idx: number) => {
    setColorSwatches((prev) => prev.filter((_, i) => i !== idx));
  };

  const COMMON_FONTS = [
    "Inter", "Montserrat", "Poppins", "Roboto", "Open Sans",
    "Playfair Display", "Raleway", "Oswald", "Lato", "DM Sans",
    "Bebas Neue", "Work Sans", "Space Grotesk", "Nunito",
  ];

  const activeFont = customFont.trim() || selectedFont || "Not selected";

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const sectionStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10,
    padding: 20,
    marginBottom: 16,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    marginBottom: 6,
    display: "block",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    fontSize: 13,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 6,
    color: "#fff",
    outline: "none",
  };

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    minHeight: 70,
    resize: "vertical" as const,
    fontFamily: "inherit",
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px 16px" }}>
      {/* Header + Client Selector */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
          Client Generator
        </h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            style={{ ...inputStyle, width: "auto", minWidth: 160 }}
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            value={newClientName}
            onChange={(e) => setNewClientName(e.target.value)}
            placeholder="New client..."
            onKeyDown={(e) => e.key === "Enter" && handleCreateClient()}
            style={{ ...inputStyle, width: 140 }}
          />
          <button
            onClick={handleCreateClient}
            disabled={!newClientName.trim() || creatingClient}
            style={{
              padding: "8px 14px",
              fontSize: 12,
              fontWeight: 600,
              background: "#6366f1",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              whiteSpace: "nowrap" as const,
              opacity: !newClientName.trim() ? 0.5 : 1,
            }}
          >
            {creatingClient ? "..." : "+ New"}
          </button>
        </div>
      </div>

      {selectedClientId && (
        <>
          {/* ── Website Scan ── */}
          <div
            style={{
              ...sectionStyle,
              borderColor: "rgba(99,102,241,0.3)",
              background: "rgba(99,102,241,0.05)",
            }}
          >
            <h2
              style={{
                fontSize: 15,
                fontWeight: 600,
                margin: "0 0 10px",
                color: "rgba(255,255,255,0.9)",
              }}
            >
              Website Scan{" "}
              <span
                style={{
                  fontWeight: 400,
                  fontSize: 12,
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                Auto-populate fields from a brand website
              </span>
            </h2>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://brand-website.com"
                onKeyDown={(e) => e.key === "Enter" && handleScanWebsite()}
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                onClick={handleScanWebsite}
                disabled={!websiteUrl.trim() || scanStatus === "scanning"}
                style={{
                  padding: "8px 20px",
                  fontSize: 13,
                  fontWeight: 600,
                  background:
                    !websiteUrl.trim() || scanStatus === "scanning"
                      ? "rgba(99,102,241,0.3)"
                      : "#6366f1",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor:
                    !websiteUrl.trim() || scanStatus === "scanning"
                      ? "default"
                      : "pointer",
                  whiteSpace: "nowrap" as const,
                  minWidth: 80,
                }}
              >
                {scanStatus === "scanning" ? "Scanning..." : "Scan"}
              </button>
            </div>
            {scanStep && (
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background:
                      scanStatus === "scanning"
                        ? "#f59e0b"
                        : scanStatus === "complete"
                        ? "#22c55e"
                        : "rgba(255,255,255,0.3)",
                    animation:
                      scanStatus === "scanning"
                        ? "pulse 1.5s infinite"
                        : "none",
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    color:
                      scanStatus === "scanning"
                        ? "#f59e0b"
                        : scanStatus === "complete"
                        ? "#22c55e"
                        : "rgba(255,255,255,0.4)",
                  }}
                >
                  {scanStep}
                </span>
              </div>
            )}
          </div>

          {/* ── SECTION 1: Product Info ── */}
          <div style={sectionStyle}>
            <h2
              style={{
                fontSize: 15,
                fontWeight: 600,
                margin: "0 0 14px",
                color: "rgba(255,255,255,0.9)",
              }}
            >
              1. Product Info
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <div>
                <label style={labelStyle}>Product / Brand Name</label>
                <input
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Hydra Glow Serum"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>USP (Unique Selling Point)</label>
                <input
                  value={usp}
                  onChange={(e) => setUsp(e.target.value)}
                  placeholder="e.g. 72-hour hydration with plant stem cells"
                  style={inputStyle}
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Short Description</label>
              <textarea
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="1-2 sentences about the product. What it is, what it does, who it's for."
                style={textareaStyle}
              />
            </div>
          </div>

          {/* ── SECTION 2: Visual Identity ── */}
          <div style={sectionStyle}>
            <h2
              style={{
                fontSize: 15,
                fontWeight: 600,
                margin: "0 0 14px",
                color: "rgba(255,255,255,0.9)",
                fontSize: 15,
              }}
            >
              2. Visual Identity
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <div>
                <label style={labelStyle}>Brand Colors</label>
                <input
                  value={brandColors}
                  onChange={(e) => setBrandColors(e.target.value)}
                  placeholder="e.g. Deep navy, gold, off-white"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Visual Style</label>
                <select
                  value={visualStyle}
                  onChange={(e) => setVisualStyle(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Select a style...</option>
                  {VISUAL_STYLE_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Mood / Brand Tone</label>
              <input
                value={moodTone}
                onChange={(e) => setMoodTone(e.target.value)}
                placeholder="e.g. Premium, sophisticated, confident"
                style={inputStyle}
              />
            </div>

            {/* Color Swatches */}
            <div style={{ marginTop: 14 }}>
              <label style={labelStyle}>Color Swatches</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: colorSwatches.length > 0 ? 10 : 0 }}>
                {colorSwatches.map((c, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 6,
                      padding: "4px 10px",
                    }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        background: c.hex,
                        border: "1px solid rgba(255,255,255,0.2)",
                      }}
                    />
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>
                      {c.hex}
                    </span>
                    {c.label && (
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
                        {c.label}
                      </span>
                    )}
                    <button
                      onClick={() => removeColorSwatch(idx)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                        fontSize: 12,
                        padding: 0,
                        marginLeft: 2,
                      }}
                    >
                      {"\u00D7"}
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="color"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  style={{
                    width: 36,
                    height: 30,
                    padding: 0,
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 4,
                    cursor: "pointer",
                    background: "transparent",
                  }}
                />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", minWidth: 60 }}>
                  {newColorHex}
                </span>
                <button
                  onClick={addColorSwatch}
                  style={{
                    padding: "4px 12px",
                    fontSize: 11,
                    fontWeight: 600,
                    background: "rgba(99,102,241,0.2)",
                    color: "#a5b4fc",
                    border: "1px solid rgba(99,102,241,0.3)",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  + Add Color
                </button>
              </div>
            </div>

            {/* Font Chooser */}
            <div style={{ marginTop: 14 }}>
              <label style={labelStyle}>Font</label>
              <div style={{ marginBottom: 8 }}>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    marginBottom: 8,
                  }}
                >
                  {COMMON_FONTS.map((font) => (
                    <button
                      key={font}
                      onClick={() => {
                        setSelectedFont(font);
                        setCustomFont("");
                      }}
                      style={{
                        padding: "4px 12px",
                        fontSize: 11,
                        borderRadius: 4,
                        border:
                          selectedFont === font && !customFont
                            ? "1px solid #6366f1"
                            : "1px solid rgba(255,255,255,0.12)",
                        background:
                          selectedFont === font && !customFont
                            ? "rgba(99,102,241,0.2)"
                            : "transparent",
                        color:
                          selectedFont === font && !customFont
                            ? "#a5b4fc"
                            : "rgba(255,255,255,0.6)",
                        cursor: "pointer",
                        fontFamily: font + ", sans-serif",
                      }}
                    >
                      {font}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    value={customFont}
                    onChange={(e) => setCustomFont(e.target.value)}
                    placeholder="Or type a custom font name..."
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.4)",
                      whiteSpace: "nowrap" as const,
                    }}
                  >
                    Active: <strong style={{ color: "#a5b4fc" }}>{activeFont}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 3: Target Audience ── */}
          <div style={sectionStyle}>
            <h2
              style={{
                fontSize: 15,
                fontWeight: 600,
                margin: "0 0 14px",
                color: "rgba(255,255,255,0.9)",
              }}
            >
              3. Target Audience
            </h2>
            <textarea
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="Who are you making ads for? Age, interests, lifestyle, pain points..."
              style={textareaStyle}
            />
          </div>

          {/* ── SECTION 4: Top Creatives ── */}
          <div style={sectionStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <h2
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  margin: 0,
                  color: "rgba(255,255,255,0.9)",
                }}
              >
                4. Top Creatives{" "}
                <span
                  style={{
                    fontWeight: 400,
                    fontSize: 12,
                    color: "rgba(255,255,255,0.4)",
                    marginLeft: 8,
                  }}
                >
                  Upload your best 3-5 reference images
                </span>
              </h2>
              {topCreatives.length < 20 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={tcUploading}
                  style={{
                    padding: "6px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    background: "#6366f1",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  {tcUploading ? "Uploading..." : "+ Upload"}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleUploadCreative}
                style={{ display: "none" }}
              />
            </div>
            {topCreatives.length > 0 ? (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {topCreatives.map((tc) => (
                  <div
                    key={tc.id}
                    style={{
                      position: "relative",
                      width: 90,
                      height: 90,
                      borderRadius: 8,
                      overflow: "hidden",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <img
                      src={tc.url}
                      alt="creative"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    <button
                      onClick={() => handleDeleteCreative(tc.id)}
                      style={{
                        position: "absolute",
                        top: 3,
                        right: 3,
                        background: "rgba(0,0,0,0.7)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "50%",
                        width: 20,
                        height: 20,
                        fontSize: 12,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: "2px dashed rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  padding: "28px 0",
                  textAlign: "center",
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 13,
                }}
              >
                Click to upload your best ad reference images
              </div>
            )}
          </div>

          {/* ── SECTION 5: Do's and Don'ts ── */}
          <div style={sectionStyle}>
            <h2
              style={{
                fontSize: 15,
                fontWeight: 600,
                margin: "0 0 14px",
                color: "rgba(255,255,255,0.9)",
              }}
            >
              5. Do&apos;s and Don&apos;ts
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <div>
                <label
                  style={{ ...labelStyle, color: "rgba(34,197,94,0.7)" }}
                >
                  More of this
                </label>
                <textarea
                  value={moreOfThis}
                  onChange={(e) => setMoreOfThis(e.target.value)}
                  placeholder="Bold product shots, lifestyle settings, warm tones, natural lighting..."
                  style={textareaStyle}
                />
              </div>
              <div>
                <label
                  style={{ ...labelStyle, color: "rgba(239,68,68,0.7)" }}
                >
                  Less of that
                </label>
                <textarea
                  value={lessOfThat}
                  onChange={(e) => setLessOfThat(e.target.value)}
                  placeholder="Cartoon look, cluttered backgrounds, cold tones, stock photo feel..."
                  style={textareaStyle}
                />
              </div>
            </div>
          </div>

          {/* ── Save Button ── */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
              {lastSaved ? "Last saved at " + lastSaved : ""}
            </span>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "10px 28px",
                fontSize: 13,
                fontWeight: 600,
                background: "#6366f1",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? "Saving..." : "Save Client Data"}
            </button>
          </div>

          {/* ── SECTION 6: Prompts (collapsible dropdown) ── */}
          <div
            style={{
              ...sectionStyle,
              borderColor: "rgba(99,102,241,0.3)",
              background: "rgba(99,102,241,0.05)",
              padding: 0,
              overflow: "hidden",
            }}
          >
            <button
              onClick={() => setPromptsOpen(!promptsOpen)}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 20px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "rgba(255,255,255,0.9)",
              }}
            >
              <div style={{ textAlign: "left" }}>
                <h2
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    margin: "0 0 2px",
                  }}
                >
                  Prompts
                </h2>
                <p
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.4)",
                    margin: 0,
                  }}
                >
                  {DEFAULT_PROMPTS.length} curated prompts across{" "}
                  {Object.keys(promptsByAngle).length} ad angles
                </p>
              </div>
              <span
                style={{
                  fontSize: 18,
                  color: "rgba(255,255,255,0.4)",
                  transition: "transform 0.2s",
                  transform: promptsOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              >
                &#9660;
              </span>
            </button>

            {promptsOpen && (
              <div style={{ padding: "0 20px 16px" }}>
                {Object.entries(promptsByAngle).map(([angle, prompts]) => (
                  <div key={angle} style={{ marginBottom: 16 }}>
                    <h3
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        margin: "0 0 8px",
                        color: "#a5b4fc",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      {ANGLE_LABELS[angle] || angle}
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 400,
                          background: "rgba(99,102,241,0.2)",
                          padding: "2px 8px",
                          borderRadius: 10,
                          color: "rgba(255,255,255,0.5)",
                        }}
                      >
                        {prompts.length} prompts
                      </span>
                    </h3>
                    {prompts.map((p, i) => (
                      <div
                        key={i}
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          borderRadius: 6,
                          padding: "8px 12px",
                          marginBottom: 6,
                          fontSize: 12,
                          color: "rgba(255,255,255,0.7)",
                        }}
                      >
                        <strong style={{ color: "rgba(255,255,255,0.9)" }}>
                          {p.label}
                        </strong>
                        <span style={{ marginLeft: 8 }}>
                          {p.prompt_text.slice(0, 120)}
                          {p.prompt_text.length > 120 ? "..." : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
