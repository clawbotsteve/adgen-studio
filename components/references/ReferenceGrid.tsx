"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ReferenceCard } from "./ReferenceCard";
import { useToast } from "@/lib/hooks/useToast";
import type { ReferenceImage } from "@/types/domain";

interface ReferenceGridProps {
  references: ReferenceImage[];
}

type LabelFilter = "all" | "identity" | "outfit" | "product" | "background";

export function ReferenceGrid({ references }: ReferenceGridProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [filter, setFilter] = useState<LabelFilter>("all");

  const filtered =
    filter === "all"
      ? references
      : references.filter((r) => r.label === filter);

  const handleDelete = (id: string) => {
    router.refresh();
  };

  const handleSetPrimary = async (id: string, clientId: string) => {
    try {
      const res = await fetch(`/api/references/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_primary: true, client_id: clientId }),
      });

      if (!res.ok) {
        addToast("Failed to set primary reference", "error");
        return;
      }

      addToast("Primary reference updated", "success");
      router.refresh();
    } catch (error) {
      addToast("An error occurred", "error");
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {(["all", "identity", "outfit", "product", "background"] as const).map(
          (label) => (
            <button
              key={label}
              onClick={() => setFilter(label)}
              style={{
                padding: "6px 12px",
                borderRadius: 4,
                border: filter === label ? "2px solid #000" : "1px solid #ddd",
                background: filter === label ? "#f0f0f0" : "transparent",
                cursor: "pointer",
                fontWeight: filter === label ? 500 : 400,
              }}
            >
              {label === "all"
                ? "All"
                : label.charAt(0).toUpperCase() + label.slice(1)}
            </button>
          )
        )}
      </div>

      {filtered.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            color: "#999",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: 8 }}>◯</div>
          <p>No reference images found</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 16,
          }}
        >
          {filtered.map((ref) => (
            <ReferenceCard
              key={ref.id}
              reference={ref}
              onDelete={handleDelete}
              onSetPrimary={(id) => handleSetPrimary(id, ref.client_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
