"use client";

import Link from "next/link";
import type { Profile } from "@/types/domain";

interface StepProfileProps {
  profiles: Profile[];
  mode: "image" | "video" | null;
  selected: string | null;
  onSelect: (profileId: string) => void;
  aspectRatio: string;
  onAspectRatioChange: (value: string) => void;
  resolution: string;
  onResolutionChange: (value: string) => void;
}

export function StepProfile({
  profiles,
  mode,
  selected,
  onSelect,
  aspectRatio,
  onAspectRatioChange,
  resolution,
  onResolutionChange,
}: StepProfileProps) {
  const filtered = mode ? profiles.filter((p) => p.mode === mode) : [];

  return (
    <div className="bw-step">
      <div className="bw-step-header">
        <h2 className="bw-step-title">Select Profile</h2>
        <p className="bw-step-desc">Choose a generation profile configured for {mode} mode.</p>
      </div>

      {filtered.length === 0 ? (
        <div className="bw-empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p>No profiles found for {mode} mode.</p>
          <Link href="/profiles" className="bw-btn bw-btn-secondary">Create Profile</Link>
        </div>
      ) : (
        <div className="bw-card-grid bw-card-grid-2">
          {filtered.map((profile) => (
            <button
              key={profile.id}
              className={`bw-select-card bw-profile-card ${selected === profile.id ? "bw-selected" : ""}`}
              onClick={() => onSelect(profile.id)}
            >
              <div className="bw-card-info" style={{ width: "100%" }}>
                <span className="bw-card-name">{profile.name}</span>
                <div className="bw-profile-details">
                  <div className="bw-detail">
                    <span className="bw-detail-label">Endpoint</span>
                    <span className="bw-detail-value">{profile.endpoint}</span>
                  </div>
                  <div className="bw-detail">
                    <span className="bw-detail-label">Aspect Ratio</span>
                    <span className="bw-detail-value">{profile.aspect_ratio}</span>
                  </div>
                  <div className="bw-detail">
                    <span className="bw-detail-label">Resolution</span>
                    <span className="bw-detail-value">{profile.resolution}</span>
                  </div>
                  {profile.duration_seconds && (
                    <div className="bw-detail">
                      <span className="bw-detail-label">Duration</span>
                      <span className="bw-detail-value">{profile.duration_seconds}s</span>
                    </div>
                  )}
                  {profile.audio_enabled && (
                    <div className="bw-detail">
                      <span className="bw-detail-label">Audio</span>
                      <span className="bw-detail-value bw-detail-enabled">Enabled</span>
                    </div>
                  )}
                </div>
              </div>
              {selected === profile.id && (
                <div className="bw-card-check">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Output Settings */}
      <div style={{ marginTop: 24, padding: "16px 0", borderTop: "1px solid var(--color-border, #333)" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "var(--color-text-secondary)" }}>Output Settings</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>
              Aspect Ratio
            </label>
            <select
              className="form-select"
              value={aspectRatio}
              onChange={(e) => onAspectRatioChange(e.target.value)}
              style={{ width: "100%" }}
            >
              <option value="1:1">1:1 (Square)</option>
              <option value="9:16">9:16 (Portrait)</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>
              Resolution
            </label>
            <select
              className="form-select"
              value={resolution}
              onChange={(e) => onResolutionChange(e.target.value)}
              style={{ width: "100%" }}
            >
              <option value="1K">1K</option>
              <option value="2K">2K (Recommended)</option>
              <option value="4K">4K</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
