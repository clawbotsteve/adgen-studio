"use client";

import { useRef, useState } from "react";
import type { ReferenceImage } from "@/types/domain";

interface CreativeLibraryProps {
  images: ReferenceImage[];
  selectedImage: ReferenceImage | null;
  onSelect: (image: ReferenceImage) => void;
  onUpload: (file: File) => Promise<void>;
  onDelete: (imageId: string) => void;
  uploading: boolean;
}

export function CreativeLibrary({
  images,
  selectedImage,
  onSelect,
  onUpload,
  onDelete,
  uploading,
}: CreativeLibraryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      await onUpload(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onUpload(file);
      e.target.value = "";
    }
  };

  return (
    <div className="creative-library">
      <div className="creative-library-header">
        <h3>Creative Library</h3>
        <button
          className="btn btn-sm btn-secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "+ Upload"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>

      {images.length === 0 && !uploading ? (
        <div
          className={`upload-dropzone ${dragOver ? "drag-over" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="dropzone-content">
            <span className="dropzone-icon">🖼</span>
            <p>Drop images here or click to upload</p>
            <span className="dropzone-hint">PNG, JPG, WebP up to 10MB</span>
          </div>
        </div>
      ) : (
        <div
          className={`creative-grid ${dragOver ? "drag-over" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {images.map((img) => (
            <div
              key={img.id}
              className={`creative-card ${selectedImage?.id === img.id ? "selected" : ""}`}
              onClick={() => onSelect(img)}
            >
              <img src={img.url} alt={img.label} />
              <button
                className="creative-card-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(img.id);
                }}
                title="Remove"
              >
                ×
              </button>
            </div>
          ))}

          {uploading && (
            <div className="creative-card uploading">
              <div className="upload-spinner" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
