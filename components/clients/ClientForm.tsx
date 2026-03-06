"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/hooks/useToast";

interface ClientFormProps {
  onSuccess?: () => void;
}

export function ClientForm({ onSuccess }: ClientFormProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      });

      if (!res.ok) {
        addToast("Failed to create client", "error");
        return;
      }

      addToast("Client created successfully", "success");
      setName("");
      setDescription("");
      router.refresh();
      onSuccess?.();
    } catch (error) {
      addToast("An error occurred", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="card" style={{ display: "grid", gap: 8 }}>
      <h3 style={{ marginTop: 0 }}>Add Client</h3>
      <input
        placeholder="Client name (required)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        disabled={isLoading}
      />
      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={isLoading}
        style={{ minHeight: 80 }}
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Creating..." : "Create Client"}
      </button>
    </form>
  );
}
