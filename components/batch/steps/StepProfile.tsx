"use client";

import Link from "next/link";
import type { Profile } from "@/types/domain";

interface StepProfileProps {
  profiles: Profile[];
  mode: "image" | "video" | null;
  selected: string | null;
  onSelect: (profileId: string) => void;
}

export function StepProfile({ profiles, mode, selected, onSelect }: StepProfileProps) {
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
    </div>
  );
}
