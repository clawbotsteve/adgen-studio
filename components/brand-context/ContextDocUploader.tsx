"use client";

import { useState, useRef, useCallback } from "react";
import type { BrandContextDoc } from "@/types/domain";

const FILE_TYPE_ICONS: Record<string, string> = {
  pdf: "📄",
  docx: "📝",
  doc: "📝",
  png: "🖼",
  jpg: "🖼",
  jpeg: "🖼",
  webp: "🖼",
};

const ALLOWED_EXTENSIONS = ["pdf", "docx", "doc", "png", "jpg", "jpeg", "webp"];

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function getFileExt(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ContextDocUploader({
  brandContextId,
  clientId,
  docs,
  onUploaded,
  onDelete,
}: {
  brandContextId: string;
  clientId: string;
  docs: BrandContextDoc[];
  onUploaded: () => void;
  onDelete: (docId: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    const ext = getFileExt(file.name);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      alert(`Unsupported file type (.${ext}). Please upload PDF, DOCX, PNG, JPG, or WEBP files.`);
      return;
    }
    if (file.size > MAX_SIZE) {
      alert("File too large. Maximum size is 10MB.");
      return;
    }

    setUploading(true);
    try {
      // Upload via server API to bypass Supabase bucket MIME restrictions
      const formData = new FormData();
      formData.append("file", file);
      formData.append("brandContextId", brandContextId);
      formData.append("clientId", clientId);

      const res = await fetch("/api/brand-context/docs/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(data.error || "Upload failed");
      }

      onUploaded();
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file);
    },
    [brandContextId, clientId]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadFile(file);
        }}
      />

      {/* Drop zone */}
      <div
        className={`ugc-upload-dropzone ${dragOver ? "ugc-upload-dragover" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !uploading && fileInputRef.current?.click()}
        style={{ marginBottom: docs.length > 0 ? 16 : 0 }}
      >
        <div className="ugc-upload-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="12" y2="12" />
            <line x1="15" y1="15" x2="12" y2="12" />
          </svg>
        </div>
        <p className="ugc-upload-text">
          {uploading ? "Uploading..." : (
            <>Drag & drop a file here, or <span className="ugc-upload-link">browse files</span></>
          )}
        </p>
        <p className="ugc-upload-hint">PDF, DOCX, PNG, JPG, WEBP up to 10MB</p>
      </div>

      {/* Document list */}
      {docs.length > 0 && (
        <div className="bc-doc-list">
          {docs.map((doc) => (
            <div key={doc.id} className="bc-doc-item">
              <span className="bc-doc-icon">
                {FILE_TYPE_ICONS[doc.file_type] ?? "📎"}
              </span>
              <div className="bc-doc-info">
                <span className="bc-doc-name">{doc.file_name}</span>
                <span className="bc-doc-meta">
                  {doc.file_type.toUpperCase()} · {formatBytes(doc.file_size_bytes)}
                </span>
              </div>
              <button
                className="bc-doc-delete"
                onClick={() => onDelete(doc.id)}
                title="Remove document"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
