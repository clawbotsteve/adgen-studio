"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/hooks/useToast";
import type { PromptItem } from "@/types/domain";

interface PromptItemEditorProps {
  packId: string;
  items: PromptItem[];
}

export function PromptItemEditor({ packId, items }: PromptItemEditorProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [concept, setConcept] = useState("");
  const [promptText, setPromptText] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [isLoading, setIsLoading] = useState(false);

  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!concept.trim() || !promptText.trim()) {
      addToast("Concept and prompt text are required", "error");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/prompt-packs/${packId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept: concept.trim(),
          prompt_text: promptText.trim(),
        }),
      });

      if (!res.ok) {
        addToast("Failed to add item", "error");
        return;
      }

      addToast("Item added successfully", "success");
      setConcept("");
      setPromptText("");
      router.refresh();
    } catch (error) {
      addToast("An error occurred", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!bulkText.trim()) {
      addToast("Please enter prompt items", "error");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/prompt-packs/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packId,
          content: bulkText,
          format: "json",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        addToast(
          data.error || "Failed to import items",
          "error"
        );
        return;
      }

      const data = await res.json();
      addToast(`${data.imported} items imported successfully`, "success");
      setBulkText("");
      setMode("single");
      router.refresh();
    } catch (error) {
      addToast("An error occurred", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Delete this item?")) return;

    try {
      const res = await fetch(`/api/prompt-packs/${packId}/items/${itemId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        addToast("Failed to delete item", "error");
        return;
      }

      addToast("Item deleted", "success");
      router.refresh();
    } catch (error) {
      addToast("An error occurred", "error");
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {(["single", "bulk"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: "6px 12px",
              borderRadius: 4,
              border: mode === m ? "2px solid #000" : "1px solid #ddd",
              background: mode === m ? "#f0f0f0" : "transparent",
              cursor: "pointer",
              fontWeight: mode === m ? 500 : 400,
            }}
          >
            {m === "single" ? "Add Item" : "Bulk Import"}
          </button>
        ))}
      </div>

      {mode === "single" ? (
        <form onSubmit={handleAddSingle} style={{ display: "grid", gap: 12 }}>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
              Concept
            </label>
            <input
              type="text"
              placeholder="e.g., Product Shot 1"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
              Prompt Text
            </label>
            <textarea
              placeholder="Full prompt for this item..."
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              disabled={isLoading}
              style={{ minHeight: 100 }}
              required
            />
          </div>

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Adding..." : "Add Item"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleBulkImport} style={{ display: "grid", gap: 12 }}>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
              Bulk Import (JSON or CSV)
            </label>
            <textarea
              placeholder={`JSON: [{"concept": "Item 1", "prompt_text": "..."}, ...]
CSV: concept,prompt text`}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              disabled={isLoading}
              style={{ minHeight: 120, fontFamily: "monospace" }}
            />
          </div>

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Importing..." : "Import Items"}
          </button>
        </form>
      )}

      {items.length > 0 && (
        <div>
          <h4 style={{ marginTop: 0 }}>Current Items ({items.length})</h4>
          <div style={{ display: "grid", gap: 8 }}>
            {items.map((item) => (
              <div
                key={item.id}
                className="card"
                style={{
                  padding: 12,
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  alignItems: "start",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>
                    {item.concept}
                  </div>
                  <div style={{ fontSize: "0.875rem", color: "#666" }}>
                    {item.prompt_text.substring(0, 100)}
                    {item.prompt_text.length > 100 ? "..." : ""}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="link link-danger"
                  style={{ border: "none", background: "none", cursor: "pointer" }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
