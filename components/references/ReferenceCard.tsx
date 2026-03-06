"use client";

import { useState } from "react";
import { useToast } from "@/lib/hooks/useToast";
import type { ReferenceImage } from "@/types/domain";

interface ReferenceCardProps {
  reference: ReferenceImage;
  onDelete: (id: string) => void;
  onSetPrimary?: (id: string) => void;
}

export function ReferenceCard({
  reference,
  onDelete,
  onSetPrimary,
}: ReferenceCardProps) {
  const { addToast } = useToast();
  const [imageError, setImageError] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this reference image?")) return;

    try {
      const res = await fetch(`/api/references/${reference.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        addToast("Failed to delete reference", "error");
        return;
      }

      addToast("Reference deleted", "success");
      onDelete(reference.id);
    } catch (error) {
      addToast("An error occurred", "error");
    }
  };

  return (
    <div
      className="card"
      style={{
        display: "grid",
        gap: 12,
        padding: 12,
        position: "relative",
      }}
    >
      {reference.is_primary && (
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            background: "#FFD700",
            color: "#000",
            padding: "4px 8px",
            borderRadius: 4,
            fontSize: "0.75rem",
            fontWeight: 500,
          }}
        >
          Primary
        </div>
      )}

      <div
        style={{
          width: "100%",
          height: 160,
          background: "#f0f0f0",
          borderRadius: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {!imageError ? (
          <img
            src={reference.url}
            alt={reference.label}
            onError={() => setImageError(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div style={{ textAlign: "center", color: "#999" }}>
            <div style={{ fontSize: "1.5rem" }}>◯</div>
            <div style={{ fontSize: "0.75rem", marginTop: 4 }}>
              Image unavailable
            </div>
          </div>
        )}
      </div>

      <div>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <span
            style={{
              background: "#e0e0e0",
              padding: "2px 8px",
              borderRadius: 4,
              fontSize: "0.75rem",
              fontWeight: 500,
            }}
          >
            {reference.label}
          </span>
        </div>

        {reference.tags && reference.tags.length > 0 && (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
            {reference.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  background: "#f0f0f0",
                  padding: "2px 6px",
                  borderRadius: 3,
                  fontSize: "0.7rem",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        {onSetPrimary && !reference.is_primary && (
          <button
            onClick={() => onSetPrimary(reference.id)}
            style={{
              fontSize: "0.875rem",
              padding: "6px 12px",
            }}
          >
            Set as Primary
          </button>
        )}
        <button
          onClick={handleDelete}
          className="button-danger"
          style={{
            fontSize: "0.875rem",
            padding: "6px 12px",
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
