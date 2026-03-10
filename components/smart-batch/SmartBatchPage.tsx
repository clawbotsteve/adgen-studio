"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Client, Profile, PromptPack, BrandContext } from "@/types/domain";

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
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [profileId, setProfileId] = useState("");
  const [promptPackId, setPromptPackId] = useState("");
  const [briefText, setBriefText] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [useBrandContext, setUseBrandContext] = useState(true);
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [resolution, setResolution] = useState("2K");
  const [brandContext, setBrandContext] = useState<BrandContext | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [showContextPreview, setShowContextPreview] = useState(false);
  const [launching, setLaunching] = useState(false);

  // Set initial profile and prompt pack
  useEffect(() => {
    if (profiles.length > 0 && !profileId) setProfileId(profiles[0].id);
    if (promptPacks.length > 0 && !promptPackId) setPromptPackId(promptPacks[0].id);
  }, [profiles, promptPacks]);

  // Fetch brand context when client changes
  const fetchBrandContext = useCallback(async (cid: string) => {
    setContextLoading(true);
    try {
      const res = await fetch(`/api/brand-context?clientId=${cid}`);
      const data = await res.json();
      setBrandContext(data.context ?? null);
    } catch {
      setBrandContext(null);
    } finally {
      setContextLoading(false);
    }
  }, []);

  useEffect(() => {
    if (clientId) fetchBrandContext(clientId);
  }, [clientId, fetchBrandContext]);

  const filledFields = brandContext
    ? [
        "brand_guidelines", "products", "competitive_landscape", "customer_personas",
        "founder_story", "marketing_calendar", "compliance_legal", "testing_priorities",
        "ad_format_preferences", "creative_ops_constraints", "naming_conventions", "goals",
      ].filter((k) => {
        const val = brandContext[k as keyof BrandContext];
        return typeof val === "string" && val.trim();
      })
    : [];

  const selectedProfile = profiles.find((p) => p.id === profileId);
  const selectedPack = promptPacks.find((p) => p.id === promptPackId);

  const canLaunch = clientId && profileId && promptPackId;

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
          promptPackId,
          briefText: briefText.trim() || undefined,
          additionalContext: additionalContext.trim() || undefined,
          useBrandContext,
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

  const clientName = clients.find((c) => c.id === clientId)?.name ?? "";

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Client + Brand Context Status */}
      <div className="card">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label className="form-label">Client</label>
            <select
              className="form-select"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <div className="bc-status-badge" style={{ marginBottom: 4 }}>
              {contextLoading ? (
                <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>Loading context...</span>
              ) : brandContext ? (
                <>
                  <span className="bc-status-dot bc-status-active" />
                  {filledFields.length} context fields active
                  <button
                    className="sb-preview-toggle"
                    onClick={() => setShowContextPreview(!showContextPreview)}
                  >
                    {showContextPreview ? "Hide" : "Preview"}
                  </button>
                </>
              ) : (
                <>
                  <span className="bc-status-dot" />
                  No brand context set up
                  <a href="/brand-context" className="sb-setup-link">Set up</a>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Brand Context Preview */}
        {showContextPreview && brandContext && (
          <div className="sb-context-preview">
            {filledFields.map((key) => {
              const val = brandContext[key as keyof BrandContext] as string;
              const label = key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
              return (
                <div key={key} className="sb-context-field">
                  <strong>{label}:</strong> {val.length > 150 ? val.substring(0, 150) + "..." : val}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Generation Settings */}
      <div className="card">
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>Generation Settings</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label className="form-label">Profile</label>
            <select
              className="form-select"
              value={profileId}
              onChange={(e) => setProfileId(e.target.value)}
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.mode} · {p.aspect_ratio})
                </option>
              ))}
            </select>
            {selectedProfile && (
              <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 4 }}>
                {selectedProfile.mode === "video"
                  ? `${selectedProfile.duration_seconds}s ${selectedProfile.resolution}`
                  : selectedProfile.resolution}
              </p>
            )}
          </div>
          <div>
            <label className="form-label">Prompt Pack</label>
            <select
              className="form-select"
              value={promptPackId}
              onChange={(e) => setPromptPackId(e.target.value)}
            >
              {promptPacks.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.item_count} items)
                </option>
              ))}
            </select>
            {selectedPack?.description && (
              <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 4 }}>
                {selectedPack.description}
              </p>
            )}
          </div>
        </div>

        {/* Output Settings */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
          <div>
            <label className="form-label">Aspect Ratio</label>
            <select
              className="form-select"
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
            >
              <option value="1:1">1:1 (Square)</option>
              <option value="9:16">9:16 (Portrait)</option>
            </select>
          </div>
          <div>
            <label className="form-label">Resolution</label>
            <select
              className="form-select"
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
            >
              <option value="1K">1K</option>
              <option value="2K">2K (Recommended)</option>
              <option value="4K">4K</option>
            </select>
          </div>
        </div>
      </div>

      {/* Brief + Additional Context */}
      <div className="card">
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>Brief & Context</h3>

        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <label className="form-label">Brief (optional)</label>
            <textarea
              className="form-input"
              rows={6}
              value={briefText}
              onChange={(e) => setBriefText(e.target.value)}
              placeholder="Paste or type your creative brief here. This will be included in every prompt alongside brand context..."
            />
            <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 4 }}>
              The brief text will be wrapped in === BRIEF === markers and prepended to each prompt.
            </p>
          </div>

          <div>
            <label className="form-label">Additional Context (optional)</label>
            <textarea
              className="form-input"
              rows={4}
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder="Any extra instructions, style notes, or context for this specific batch..."
            />
          </div>

          {/* Use Brand Context Toggle */}
          <div className="sb-toggle-row">
            <label className="sb-toggle-label">
              <input
                type="checkbox"
                checked={useBrandContext}
                onChange={(e) => setUseBrandContext(e.target.checked)}
              />
              <span>Use Brand Context</span>
            </label>
            <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
              {useBrandContext
                ? `Brand context for ${clientName} will be injected into every prompt`
                : "Brand context will NOT be included in prompts"}
            </span>
          </div>
        </div>
      </div>

      {/* Launch */}
      <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ margin: 0, fontWeight: 600 }}>
            Ready to generate {selectedPack?.item_count ?? 0} items
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--color-text-secondary)" }}>
            {useBrandContext && filledFields.length > 0
              ? `With ${filledFields.length} brand context fields`
              : "Without brand context"}
            {briefText.trim() ? " + brief" : ""}
            {additionalContext.trim() ? " + additional context" : ""}
          </p>
        </div>
        <button
          className="button button-primary"
          onClick={handleLaunch}
          disabled={!canLaunch || launching}
          style={{ minWidth: 160 }}
        >
          {launching ? "Creating Batch..." : "Generate Batch"}
        </button>
      </div>
    </div>
  );
}
