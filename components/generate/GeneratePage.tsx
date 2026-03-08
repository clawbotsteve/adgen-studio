"use client";

import { useState, useCallback, useEffect } from "react";
import type { Client, ReferenceImage } from "@/types/domain";
import { CreativeLibrary } from "./CreativeLibrary";

interface GeneratePageProps {
  clients: Client[];
}

export function GeneratePage({ clients }: GeneratePageProps) {
  const [clientId, setClientId] = useState<string>(clients[0]?.id ?? "");
  const [images, setImages] = useState<ReferenceImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<ReferenceImage | null>(
    null
  );
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingImages, setLoadingImages] = useState(false);

  // Fetch images for selected client
  const fetchImages = useCallback(async (cId: string) => {
    if (!cId) return;
    setLoadingImages(true);
    try {
      const res = await fetch(`/api/references?clientId=${cId}`);
      const data = await res.json();
      setImages(data.references ?? []);
      setSelectedImage(null);
    } catch {
      setImages([]);
    } finally {
      setLoadingImages(false);
    }
  }, []);

  // On client change
  const handleClientChange = useCallback(
    (newClientId: string) => {
      setClientId(newClientId);
      setSelectedImage(null);
      setOutputUrl(null);
      setError(null);
      fetchImages(newClientId);
    },
    [fetchImages]
  );

  // Load images on mount
  useEffect(() => {
    if (clientId) fetchImages(clientId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Upload image
  const handleUpload = useCallback(
    async (file: File) => {
      if (!clientId) return;
      setUploading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("clientId", clientId);
        formData.append("label", "identity");

        const res = await fetch("/api/generate/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }

        const data = await res.json();
        const newImage = data.image as ReferenceImage;
        setImages((prev) => [newImage, ...prev]);
        setSelectedImage(newImage);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [clientId]
  );

  // Delete image
  const handleDelete = useCallback(
    async (imageId: string) => {
      try {
        await fetch(`/api/references/${imageId}`, { method: "DELETE" });
        setImages((prev) => prev.filter((img) => img.id !== imageId));
        if (selectedImage?.id === imageId) setSelectedImage(null);
      } catch {
        // Silently fail
      }
    },
    [selectedImage]
  );

  // Generate
  const handleGenerate = useCallback(async () => {
    if (!selectedImage || !prompt.trim()) return;
    setGenerating(true);
    setError(null);
    setOutputUrl(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          prompt: prompt.trim(),
          referenceImageUrl: selectedImage.url,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }

      const data = await res.json();
      setOutputUrl(data.outputUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }, [clientId, selectedImage, prompt]);