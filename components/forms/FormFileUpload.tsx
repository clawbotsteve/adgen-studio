"use client";

import { useRef, useState } from "react";

interface FormFileUploadProps {
  accept: string;
  onFile: (file: File) => void;
  preview?: string;
  maxSizeMB?: number;
}

export function FormFileUpload({
  accept,
  onFile,
  preview,
  maxSizeMB = 10,
}: FormFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>();

  const validateFile = (file: File): boolean => {
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`File size exceeds ${maxSizeMB}MB limit`);
      return false;
    }
    setError(undefined);
    return true;
  };

  const handleFile = (file: File) => {
    if (validateFile(file)) {
      onFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  return (
    <>
      <div
        className={`file-upload-zone ${isDragging ? "dragging" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
      >
        <div className="file-upload-icon">📁</div>
        <div className="file-upload-text">
          Drag and drop your file here, or click to select
        </div>
        <div className="file-upload-hint">
          Supports {accept.split(",").join(", ")} (Max {maxSizeMB}MB)
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
          }
        }}
        style={{ display: "none" }}
      />

      {preview && (
        <div className="file-preview">
          <img src={preview} alt="Preview" className="file-preview-image" />
        </div>
      )}

      {error && <div className="form-error">{error}</div>}
    </>
  );
}
