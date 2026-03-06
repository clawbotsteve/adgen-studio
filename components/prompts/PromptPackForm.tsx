"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/hooks/useToast";

interface PromptPackFormProps {
  onSuccess?: () => void;
}

export function PromptPackForm({ onSuccess }: PromptPackFormProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!name.trim()) {
      addToast("Pack name is required", "error");
      setIsLoading(false);
      return;
    }

    try {
      const tagsArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const res = await fetch("/api/prompt-packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          tags: tagsArray,
        }),
      });

      if (!res.ok) {
        addToast("Failed to create prompt pack", "error");
        return;
      }

      addToast("Prompt pack created successfully", "success");
      setName("");
      setDescription("");
      setTags("");
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
      <h3 style={{ marginTop: 0 }}>Create Prompt Pack</h3>

      <div>
        <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
          Name
        </label>
        <input
          type="text"
          placeholder="e.g., Product Photography"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
          required
        />
      </div>

      <div>
        <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
          Description (optional)
        </label>
        <textarea
          placeholder="Describe this prompt pack..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isLoading}
          style={{ minHeight: 60 }}
        />
      </div>

      <div>
        <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
          Tags (comma-separated, optional)
        </label>
        <input
          type="text"
          placeholder="e.g., photography, products, 2024"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <button type="submit" disabled={isLoading}>
        {isLoading ? "Creating..." : "Create Pack"}
      </button>
    </form>
  );
}
