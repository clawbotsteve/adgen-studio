"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/hooks/useToast";
import type { Client } from "@/types/domain";

interface ReferenceUploadProps {
  clients: Client[];
}

const LABEL_OPTIONS = ["identity", "outfit", "product", "background"] as const;

export function ReferenceUpload({ clients }: ReferenceUploadProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [clientId, setClientId] = useState("");
  const [label, setLabel] = useState<"identity" | "outfit" | "product" | "background">(
    "identity"
  );
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!clientId.trim()) {
      addToast("Please select a client", "error");
      setIsLoading(false);
      return;
    }

    if (!url.trim()) {
      addToast("Please enter an image URL", "error");
      setIsLoading(false);
      return;
    }

    try {
      const tagsArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const res = await fetch("/api/references", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId.trim(),
          label,
          url: url.trim(),
          tags: tagsArray,
        }),
      });

      if (!res.ok) {
        addToast("Failed to upload reference", "error");
        return;
      }

      addToast("Reference uploaded successfully", "success");
      setClientId("");
      setLabel("identity");
      setUrl("");
      setTags("");
      router.refresh();
    } catch (error) {
      addToast("An error occurred", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="card" style={{ display: "grid", gap: 12 }}>
      <h3 style={{ marginTop: 0 }}>Upload Reference Image</h3>

      <div>
        <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
          Client
        </label>
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          disabled={isLoading}
          required
        >
          <option value="">Select a client...</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
          Label
        </label>
        <select
          value={label}
          onChange={(e) =>
            setLabel(e.target.value as "identity" | "outfit" | "product" | "background")
          }
          disabled={isLoading}
        >
          {LABEL_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
          Image URL
        </label>
        <input
          type="url"
          placeholder="https://example.com/image.jpg"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isLoading}
          required
        />
      </div>

      <div>
        <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
          Tags (comma-separated, optional)
        </label>
        <input
          type="text"
          placeholder="e.g., fashion, premium, 2024"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <button type="submit" disabled={isLoading || !clientId}>
        {isLoading ? "Uploading..." : "Upload Reference"}
      </button>
    </form>
  );
}
