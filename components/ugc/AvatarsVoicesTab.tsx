"use client";

import { useState, useEffect, useCallback } from "react";
import type { ClientAvatar, ClientVoice, AvatarVoicePreset } from "@/types/ugc";

export function AvatarsVoicesTab({ brandId }: { brandId: string }) {
  const [avatars, setAvatars] = useState<ClientAvatar[]>([]);
  const [voices, setVoices] = useState<ClientVoice[]>([]);
  const [presets, setPresets] = useState<AvatarVoicePreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<"avatars" | "voices" | "presets">("avatars");

  // Create form states
  const [showCreate, setShowCreate] = useState(false);
  const [avatarName, setAvatarName] = useState("");
  const [avatarType, setAvatarType] = useState("premade");
  const [voiceName, setVoiceName] = useState("");
  const [voiceLanguage, setVoiceLanguage] = useState("en");
  const [voiceCloned, setVoiceCloned] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [presetAvatarId, setPresetAvatarId] = useState("");
  const [presetVoiceId, setPresetVoiceId] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, vRes, pRes] = await Promise.all([
        fetch(`/api/ugc/avatars?brandId=${brandId}`),
        fetch(`/api/ugc/voices?brandId=${brandId}`),
        fetch(`/api/ugc/presets?brandId=${brandId}`),
      ]);
      const [aJson, vJson, pJson] = await Promise.all([aRes.json(), vRes.json(), pRes.json()]);
      setAvatars(aJson.avatars ?? []);
      setVoices(vJson.voices ?? []);
      setPresets(pJson.presets ?? []);
    } catch (err) {
      console.error("Failed to fetch avatars/voices:", err);
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleCreateAvatar = async () => {
    if (!avatarName.trim()) return;
    setCreating(true);
    try {
      await fetch("/api/ugc/avatars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_id: brandId, name: avatarName.trim(), avatar_type: avatarType }),
      });
      setAvatarName("");
      setShowCreate(false);
      fetchAll();
    } finally {
      setCreating(false);
    }
  };

  const handleCreateVoice = async () => {
    if (!voiceName.trim()) return;
    setCreating(true);
    try {
      await fetch("/api/ugc/voices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_id: brandId, name: voiceName.trim(), language: voiceLanguage, is_cloned: voiceCloned }),
      });
      setVoiceName("");
      setShowCreate(false);
      fetchAll();
    } finally {
      setCreating(false);
    }
  };

  const handleCreatePreset = async () => {
    if (!presetName.trim()) return;
    setCreating(true);
    try {
      await fetch("/api/ugc/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_id: brandId,
          name: presetName.trim(),
          avatar_id: presetAvatarId || undefined,
          voice_id: presetVoiceId || undefined,
        }),
      });
      setPresetName("");
      setShowCreate(false);
      fetchAll();
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (type: string, id: string) => {
    try {
      await fetch(`/api/ugc/${type}/${id}`, { method: "DELETE" });
      fetchAll();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  if (loading) return <div className="ugc-empty-state">Loading avatars and voices...</div>;

  return (
    <div>
      <div className="ugc-section-header">
        <h3>Avatars & Voices</h3>
        <button className="button button-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Cancel" : `+ New ${section === "avatars" ? "Avatar" : section === "voices" ? "Voice" : "Preset"}`}
        </button>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(["avatars", "voices", "presets"] as const).map((s) => (
          <button
            key={s}
            className={`button ${section === s ? "button-primary" : "button-secondary"}`}
            onClick={() => { setSection(s); setShowCreate(false); }}
          >
            {s === "avatars" ? `Avatars (${avatars.length})` : s === "voices" ? `Voices (${voices.length})` : `Presets (${presets.length})`}
          </button>
        ))}
      </div>

      {/* Create forms */}
      {showCreate && section === "avatars" && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label className="form-label">Avatar Name</label>
              <input className="form-input" value={avatarName} onChange={(e) => setAvatarName(e.target.value)} placeholder="e.g., Sarah (Fitness)" />
            </div>
            <div>
              <label className="form-label">Type</label>
              <select className="form-select" value={avatarType} onChange={(e) => setAvatarType(e.target.value)}>
                <option value="premade">Premade</option>
                <option value="trained">Trained</option>
              </select>
            </div>
            <button className="button button-primary" onClick={handleCreateAvatar} disabled={creating}>Create Avatar</button>
          </div>
        </div>
      )}

      {showCreate && section === "voices" && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label className="form-label">Voice Name</label>
              <input className="form-input" value={voiceName} onChange={(e) => setVoiceName(e.target.value)} placeholder="e.g., Confident Female" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label className="form-label">Language</label>
                <select className="form-select" value={voiceLanguage} onChange={(e) => setVoiceLanguage(e.target.value)}>
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>
              <div>
                <label className="form-label">Cloned Voice</label>
                <select className="form-select" value={voiceCloned ? "yes" : "no"} onChange={(e) => setVoiceCloned(e.target.value === "yes")}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
            </div>
            <button className="button button-primary" onClick={handleCreateVoice} disabled={creating}>Create Voice</button>
          </div>
        </div>
      )}

      {showCreate && section === "presets" && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label className="form-label">Preset Name</label>
              <input className="form-input" value={presetName} onChange={(e) => setPresetName(e.target.value)} placeholder="e.g., Default Female + Energetic" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label className="form-label">Avatar</label>
                <select className="form-select" value={presetAvatarId} onChange={(e) => setPresetAvatarId(e.target.value)}>
                  <option value="">None</option>
                  {avatars.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Voice</label>
                <select className="form-select" value={presetVoiceId} onChange={(e) => setPresetVoiceId(e.target.value)}>
                  <option value="">None</option>
                  {voices.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
            </div>
            <button className="button button-primary" onClick={handleCreatePreset} disabled={creating}>Create Preset</button>
          </div>
        </div>
      )}

      {/* Lists */}
      {section === "avatars" && (
        <div className="avatar-grid">
          {avatars.length === 0 ? (
            <div className="ugc-empty-state">No avatars yet.</div>
          ) : (
            avatars.map((a) => (
              <div key={a.id} className="card avatar-card">
                <div className="avatar-card-preview">
                  {a.preview_image_url ? (
                    <img src={a.preview_image_url} alt={a.name} />
                  ) : (
                    <div className="avatar-placeholder">👤</div>
                  )}
                </div>
                <div className="avatar-card-info">
                  <strong>{a.name}</strong>
                  <span className="text-muted">{a.avatar_type} {a.provider ? `· ${a.provider}` : ""}</span>
                </div>
                <button className="button button-danger button-sm" onClick={() => handleDelete("avatars", a.id)}>Remove</button>
              </div>
            ))
          )}
        </div>
      )}

      {section === "voices" && (
        <div className="voice-list">
          {voices.length === 0 ? (
            <div className="ugc-empty-state">No voices yet.</div>
          ) : (
            voices.map((v) => (
              <div key={v.id} className="card voice-card">
                <div className="voice-card-info">
                  <strong>{v.name}</strong>
                  <span className="text-muted">
                    {v.language} {v.is_cloned ? "· Cloned" : ""} {v.provider ? `· ${v.provider}` : ""}
                  </span>
                  {v.style_tags.length > 0 && (
                    <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                      {v.style_tags.map((t) => (
                        <span key={t} className="concept-tag">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <button className="button button-danger button-sm" onClick={() => handleDelete("voices", v.id)}>Remove</button>
              </div>
            ))
          )}
        </div>
      )}

      {section === "presets" && (
        <div className="voice-list">
          {presets.length === 0 ? (
            <div className="ugc-empty-state">No presets yet.</div>
          ) : (
            presets.map((p) => (
              <div key={p.id} className="card voice-card">
                <div className="voice-card-info">
                  <strong>{p.name}</strong>
                  <span className="text-muted">
                    Avatar: {avatars.find((a) => a.id === p.avatar_id)?.name ?? "None"} ·
                    Voice: {voices.find((v) => v.id === p.voice_id)?.name ?? "None"}
                  </span>
                  {p.is_default && <span className="status-badge" style={{ backgroundColor: "var(--color-info)" }}>Default</span>}
                </div>
                <button className="button button-danger button-sm" onClick={() => handleDelete("presets", p.id)}>Remove</button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
