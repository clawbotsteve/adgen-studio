"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/hooks/useToast";

const DEFAULT_ENDPOINTS = {
  image: "fal-ai/nano-banana-2/edit",
  video: "fal-ai/kling-video/v2.6/pro/image-to-video",
};

interface ProfileFormProps {
  onSuccess?: () => void;
}

export function ProfileForm({ onSuccess }: ProfileFormProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"image" | "video">("image");
  const [formData, setFormData] = useState({
    name: "",
    endpoint: DEFAULT_ENDPOINTS.image,
    aspect_ratio: "1:1",
    resolution: "1024x1024",
    duration_seconds: 5,
    audio_enabled: false,
    seed: "",
    prompt_prefix: "",
    prompt_suffix: "",
  });

  const handleModeChange = (newMode: "image" | "video") => {
    setMode(newMode);
    setFormData({
      ...formData,
      endpoint: DEFAULT_ENDPOINTS[newMode],
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.name.trim()) {
      addToast("Profile name is required", "error");
      setIsLoading(false);
      return;
    }

    try {
      const payload: Record<string, any> = {
        name: formData.name.trim(),
        mode,
        endpoint: formData.endpoint.trim(),
        aspect_ratio: formData.aspect_ratio,
        resolution: formData.resolution,
        audio_enabled: formData.audio_enabled,
        seed: formData.seed ? parseInt(formData.seed) : null,
        prompt_prefix: formData.prompt_prefix.trim() || null,
        prompt_suffix: formData.prompt_suffix.trim() || null,
      };

      if (mode === "video") {
        payload.duration_seconds = parseInt(formData.duration_seconds.toString());
      }

      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        addToast("Failed to create profile", "error");
        return;
      }

      addToast("Profile created successfully", "success");
      setFormData({
        name: "",
        endpoint: DEFAULT_ENDPOINTS.image,
        aspect_ratio: "1:1",
        resolution: "1024x1024",
        duration_seconds: 5,
        audio_enabled: false,
        seed: "",
        prompt_prefix: "",
        prompt_suffix: "",
      });
      setMode("image");
      router.refresh();
      onSuccess?.();
    } catch (error) {
      addToast("An error occurred", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="card" style={{ display: "grid", gap: 12 }}>
      <h3 style={{ marginTop: 0 }}>Create Profile</h3>

      <div>
        <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
          Profile Name
        </label>
        <input
          type="text"
          placeholder="e.g., Default Image Profile"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          disabled={isLoading}
          required
        />
      </div>

      <div>
        <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
          Mode
        </label>
        <div style={{ display: "flex", gap: 12 }}>
          {(["image", "video"] as const).map((m) => (
            <label key={m} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="radio"
                name="mode"
                value={m}
                checked={mode === m}
                onChange={(e) => handleModeChange(e.target.value as "image" | "video")}
                disabled={isLoading}
              />
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
          Endpoint
        </label>
        <input
          type="text"
          value={formData.endpoint}
          onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
          disabled={isLoading}
          required
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
            Aspect Ratio
          </label>
          <input
            type="text"
            placeholder="1:1"
            value={formData.aspect_ratio}
            onChange={(e) => setFormData({ ...formData, aspect_ratio: e.target.value })}
            disabled={isLoading}
          />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
            Resolution
          </label>
          <input
            type="text"
            placeholder="1024x1024"
            value={formData.resolution}
            onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
            disabled={isLoading}
          />
        </div>
      </div>

      {mode === "video" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
              Duration (seconds)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={formData.duration_seconds}
              onChange={(e) =>
                setFormData({ ...formData, duration_seconds: parseInt(e.target.value) })
              }
              disabled={isLoading}
            />
          </div>
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={formData.audio_enabled}
                onChange={(e) =>
                  setFormData({ ...formData, audio_enabled: e.target.checked })
                }
                disabled={isLoading}
              />
              <span style={{ fontWeight: 500 }}>Enable Audio</span>
            </label>
            {formData.audio_enabled && (
              <p style={{ color: "#ff9800", fontSize: "0.875rem", marginTop: 6 }}>
                Warning: Audio adds ~5x cost
              </p>
            )}
          </div>
        </div>
      )}

      <div>
        <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
          Seed (optional)
        </label>
        <input
          type="number"
          placeholder="Random seed"
          value={formData.seed}
          onChange={(e) => setFormData({ ...formData, seed: e.target.value })}
          disabled={isLoading}
        />
      </div>

      <div>
        <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
          Prompt Prefix (optional)
        </label>
        <textarea
          placeholder="Text to prepend to all prompts"
          value={formData.prompt_prefix}
          onChange={(e) => setFormData({ ...formData, prompt_prefix: e.target.value })}
          disabled={isLoading}
          style={{ minHeight: 60 }}
        />
      </div>

      <div>
        <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
          Prompt Suffix (optional)
        </label>
        <textarea
          placeholder="Text to append to all prompts"
          value={formData.prompt_suffix}
          onChange={(e) => setFormData({ ...formData, prompt_suffix: e.target.value })}
          disabled={isLoading}
          style={{ minHeight: 60 }}
        />
      </div>

      <button type="submit" disabled={isLoading}>
        {isLoading ? "Creating..." : "Create Profile"}
      </button>
    </form>
  );
}
