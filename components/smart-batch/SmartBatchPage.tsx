"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Client, Profile, PromptPack } from "@/types/domain";

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

  // ———————— State ————————
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [profileId, setProfileId] = useState(profiles[0]?.id ?? "");
  const [promptPackId, setPromptPackId] = useState(promptPacks[0]?.id ?? "");
  const [briefText, setBriefText] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [aspect, setAspect] = useState("1:1");
  const [resolution, setResolution] = useState("2K");
  const [launching, setLaunching] = useState(false);
  const [clientProfileConfigured, setClientProfileConfigured] = useState(false);
  const [clientFormData, setClientFormData] = useState<Record<string, string> | null>(null);
  const [contentGenData, setContentGenData] = useState<Record<string, string> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ———————— Data fetching ————————

  // Fetch client data when client changes
  useEffect(() => {
    if (!clientId) { setContentGenData(null); setClientProfileConfigured(false); setClientFormData(null); return; }
    (async () => {
      try {
        const resp = await fetch(`/api/clients/${clientId}`);
        if (!resp.ok) return;
        const { client } = await resp.json();
        const fd = client?.defaults?.formData;
        if (fd) {
          // Check if client profile is configured (any formData fields filled)
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

          // Extract content generation preferences
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

  const canLaunch = clientId && profileId && promptPackId;

  // ———————— Handlers ————————

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
          packId: promptPackId,
          brief: briefText,
          additionalContext,
          brandContext: clientFormData ?? undefined,
          contentGeneration: contentGenData || undefined,
          aspect,
          resolution,
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

  const clientName = clients.find((c) => c.id === clientId)?.name ?? "";

  // ———————— Render ————————
  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* Client + Profile Status */}
      <div className="card">
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 16 }}>
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

          {/* Client profile status */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {clientProfileConfigured ? (
              <>
                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#4ade80" }} />
                <span style={{ fontSize: 13 }}>
                  Client profile configured
                </span>
                <a href="/client-generator" className="sb-setup-link">Edit</a>
              </>
            ) : (
              <>
                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#ffa026" }} />
                <span style={{ fontSize: 13 }}>No client profile set up</span>
                <a href="/client-generator" className="sb-setup-link">Set up</a>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content Generation Preferences */}
      <div className="card">
        <h3 className="sb-section-title">Content Generation Preferences</h3>
        {contentGenData ? (
          <div className="sb-context-preview">
            {Object.entries(contentGenData).map(([key, val]) => (
              <div key={key} className="sb-context-field">
                <span className="sb-context-key">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                <span className="sb-context-val">{String(val).slice(0, 80)}{String(val).length > 80 ? "\u2026" : ""}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="sb-empty-note">No content generation preferences set. Configure them in Client Generator.</p>
        )}
      </div>

      {/* Generation Settings */}
      <div className="card">
        <h3 className="sb-section-title">Generation Settings</h3>
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
          </div>
          <div>
            <label className="form-label">Aspect Ratio</label>
            <select
              className="form-select"
              value={aspect}
              onChange={(e) => setAspect(e.target.value)}
            >
              <option value="1:1">1:1 (Square)</option>
              <option value="16:9">16:9 (Widescreen)</option>
              <option value="9:16">9:16 (Portrait)</option>
              <option value="4:5">4:5 (Instagram)</option>
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

      {/* Brief & Context */}
      <div className="card">
        <h3 className="sb-section-title">Brief &amp; Context</h3>
        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <label className="form-label">Brief (optional)</label>
            <textarea
              className="form-textarea"
              rows={4}
              value={briefText}
              onChange={(e) => setBriefText(e.target.value)}
              placeholder="Optional creative brief..."
            />
            <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
              {clientProfileConfigured
                ? `Client profile for ${clientName} will be injected into every prompt`
                : "No client profile configured — set one up in Client Generator"}
            </span>
          </div>
          <div>
            <label className="form-label">Additional Context (optional)</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder="Any additional context or instructions..."
            />
          </div>
        </div>
      </div>

      {/* Launch */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {error && <p style={{ color: "#ff4444", margin: 0 }}>{error}</p>}
        <button
          className="btn-primary"
          disabled={!canLaunch || launching}
          onClick={handleLaunch}
        >
          {launching ? "Creating Batch…" : "Generate Batch"}
        </button>
      </div>
    </div>
  );
}
