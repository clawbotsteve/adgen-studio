"use client";

import Link from "next/link";
import type { Profile } from "@/types/domain";

interface StepProfileProps {
  profiles: Profile[];
  mode: "image" | "video" | null;
  selected: string | null;
  onSelect: (profileId: string) => void;
}

export function StepProfile({
  profiles,
  mode,
  selected,
  onSelect,
}: StepProfileProps) {
  const filtered = mode ? profiles.filter((p) => p.mode === mode) : [];

  return (
    <div className="wizard-step">
      <div className="step-header">
        <h2>Select Profile</h2>
        <p>Choose a profile configured for {mode} generation.</p>
      </div>

      {filtered.length === 0 ? (
        <div className="step-warning">
          <p>No profiles found for {mode} mode.</p>
          <Link href="/profiles" className="button button-secondary">
            Create Profile
          </Link>
        </div>
      ) : (
        <div className="step-profiles">
          {filtered.map((profile) => (
            <div
              key={profile.id}
              className={`profile-card ${selected === profile.id ? "selected" : ""}`}
              onClick={() => onSelect(profile.id)}
            >
              <div className="profile-header">
                <h3>{profile.name}</h3>
              </div>
              <div className="profile-details">
                <div className="detail-row">
                  <span className="detail-label">Endpoint:</span>
                  <span className="detail-value">{profile.endpoint}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Aspect Ratio:</span>
                  <span className="detail-value">{profile.aspect_ratio}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Resolution:</span>
                  <span className="detail-value">{profile.resolution}</span>
                </div>
                {profile.duration_seconds && (
                  <div className="detail-row">
                    <span className="detail-label">Duration:</span>
                    <span className="detail-value">
                      {profile.duration_seconds}s
                    </span>
                  </div>
                )}
                {profile.audio_enabled && (
                  <div className="detail-row">
                    <span className="detail-label">Audio:</span>
                    <span className="detail-value">Enabled</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
