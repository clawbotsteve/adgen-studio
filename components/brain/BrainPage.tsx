"use client";

import { useState, useRef, useCallback } from "react";

interface Client {
  id: string;
  name: string;
}

interface BrainFile {
  id: string;
  file: File;
  preview: string | null;
  type: "image" | "pdf";
  name: string;
  size: number;
}

type TrainingStatus = "idle" | "processing" | "complete";

export function BrainPage({ clients }: { clients: Client[] }) {
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [files, setFiles] = useState<BrainFile[]>([]);
  const [trainingStatus, setTrainingStatus] =
    useState<TrainingStatus>("idle");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedClient = clients.find((c) => c.id === clientId);

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const accepted = Array.from(incoming).filter((f) => {
      const ext = f.name.toLowerCase();
      return (
        ext.endsWith(".png") ||
        ext.endsWith(".jpg") ||
        ext.endsWith(".jpeg") ||
        ext.endsWith(".webp") ||
        ext.endsWith(".pdf")
      );
    });

    const newFiles: BrainFile[] = accepted.map((file) => {
      const isPdf = file.name.toLowerCase().endsWith(".pdf");
      return {
        id: crypto.randomUUID(),
        file,
        preview: isPdf ? null : URL.createObjectURL(file),
        type: isPdf ? "pdf" : "image",
        name: file.name,
        size: file.size,
      };
    });

    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) URL.revokeObjectURL(file.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleTrainBrain = async () => {
    if (files.length === 0 || !clientId) return;
    setTrainingStatus("processing");
    try {
      const formData = new FormData();
      formData.append("clientId", clientId);
      files.forEach((f) => formData.append("files", f.file));

      const res = await fetch("/api/brain/train", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        setTrainingStatus("complete");
      } else {
        alert("Training failed. Please try again.");
        setTrainingStatus("idle");
      }
    } catch {
      alert("Training failed. Please try again.");
      setTrainingStatus("idle");
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const imageCount = files.filter((f) => f.type === "image").length;
  const pdfCount = files.filter((f) => f.type === "pdf").length;

  const statusColors: Record<TrainingStatus, string> = {
    idle: "rgba(255,255,255,0.4)",
    processing: "#f59e0b",
    complete: "#22c55e",
  };
  const statusLabels: Record<TrainingStatus, string> = {
    idle: "Not trained",
    processing: "Training in progress...",
    complete: "Training complete",
  };

  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 900 }}>
      {/* Header */}
      <div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            margin: "0 0 4px",
            color: "rgba(255,255,255,0.95)",
          }}
        >
          Brain
        </h1>
        <p
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.5)",
            margin: 0,
          }}
        >
          Upload your swipe files of high-performing ads. The Brain learns what
          good ads look like and uses them as reference material during
          generation.
        </p>
      </div>

      {/* Client Selector */}
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 8,
          padding: "12px 16px",
        }}
      >
        <label
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "rgba(255,255,255,0.7)",
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 6,
            display: "block",
          }}
        >
          Client / Brand
        </label>
        <select
          value={clientId}
          onChange={(e) => {
            setClientId(e.target.value);
            setTrainingStatus("idle");
          }}
          style={{
            width: "100%",
            padding: "8px 12px",
            fontSize: 13,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 6,
            color: "rgba(255,255,255,0.9)",
            outline: "none",
            cursor: "pointer",
          }}
        >
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {selectedClient && (
          <p
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.4)",
              margin: "6px 0 0",
            }}
          >
            Swipe files and training will be associated with{" "}
            <strong style={{ color: "rgba(255,255,255,0.7)" }}>
              {selectedClient.name}
            </strong>
          </p>
        )}
      </div>

      {/* Training Status Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 8,
          padding: "10px 16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: statusColors[trainingStatus],
              animation:
                trainingStatus === "processing"
                  ? "pulse 1.5s infinite"
                  : "none",
            }}
          />
          <span
            style={{
              fontSize: 12,
              color: statusColors[trainingStatus],
              fontWeight: 500,
            }}
          >
            {statusLabels[trainingStatus]}
          </span>
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
          {files.length} file{files.length !== 1 ? "s" : ""}
          {imageCount > 0 &&
            ` \u00B7 ${imageCount} image${imageCount !== 1 ? "s" : ""}`}
          {pdfCount > 0 &&
            ` \u00B7 ${pdfCount} PDF${pdfCount !== 1 ? "s" : ""}`}
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: dragOver
            ? "2px dashed #6366f1"
            : "2px dashed rgba(255,255,255,0.15)",
          borderRadius: 12,
          padding: files.length === 0 ? "60px 20px" : "20px",
          textAlign: "center",
          cursor: "pointer",
          background: dragOver
            ? "rgba(99,102,241,0.08)"
            : "rgba(255,255,255,0.02)",
          transition: "all 0.2s ease",
          minHeight: files.length === 0 ? 200 : "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {files.length === 0 ? (
          <>
            <div style={{ fontSize: 40, opacity: 0.3, marginBottom: 8 }}>
              +
            </div>
            <p
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.6)",
                margin: 0,
                fontWeight: 500,
              }}
            >
              Drop your swipe files here
            </p>
            <p
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.35)",
                margin: 0,
              }}
            >
              PNG, JPG, WEBP, PDF {"\u2014"} drag as many as you need
            </p>
          </>
        ) : (
          <p
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.4)",
              margin: 0,
            }}
          >
            Drop more files here or click to browse
          </p>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.webp,.pdf"
          multiple
          onChange={handleFileSelect}
          style={{ display: "none" }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* File Grid */}
      {files.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
            gap: 10,
          }}
        >
          {files.map((f) => (
            <div
              key={f.id}
              style={{
                position: "relative",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              {f.type === "image" && f.preview ? (
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={f.preview}
                    alt={f.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(239,68,68,0.08)",
                    gap: 4,
                  }}
                >
                  <span style={{ fontSize: 28, opacity: 0.5 }}>PDF</span>
                </div>
              )}
              <div style={{ padding: "6px 8px" }}>
                <p
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.7)",
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {f.name}
                </p>
                <p
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.35)",
                    margin: "2px 0 0",
                  }}
                >
                  {formatSize(f.size)}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(f.id);
                }}
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.7)",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  lineHeight: 1,
                }}
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Train Button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 8,
          padding: "10px 16px",
        }}
      >
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
          {files.length === 0
            ? "Upload swipe files to get started"
            : `${files.length} file${files.length !== 1 ? "s" : ""} ready for training`}
        </span>
        <button
          onClick={handleTrainBrain}
          disabled={
            files.length === 0 ||
            !clientId ||
            trainingStatus === "processing"
          }
          style={{
            padding: "8px 24px",
            fontSize: 13,
            fontWeight: 600,
            background:
              files.length === 0 || !clientId || trainingStatus === "processing"
                ? "rgba(99,102,241,0.3)"
                : "#6366f1",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor:
              files.length === 0 || !clientId || trainingStatus === "processing"
                ? "default"
                : "pointer",
            opacity: files.length === 0 || !clientId ? 0.5 : 1,
            minWidth: 140,
          }}
        >
          {trainingStatus === "processing" ? "Training..." : "Train Brain"}
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
