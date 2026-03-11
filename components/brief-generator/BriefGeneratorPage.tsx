"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/lib/hooks/useToast";

type ClientOption = { id: string; name: string };

type GeneratedImage = {
  url: string;
  concept: string;
};

export function BriefGeneratorPage({ tenantId }: { tenantId: string }) {
  const { toast } = useToast();
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [briefFile, setBriefFile] = useState<File | null>(null);
  const [instructions, setInstructions] = useState("");
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<GeneratedImage[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [briefUploading, setBriefUploading] = useState(false);

  // Fetch clients
  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setClients(data);
      })
      .catch(() => {});
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      setBriefFile(file);
    } else {
      toast("Please upload a PDF file", "error");
    }
  };

  const handleFileSelect = () => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = ".pdf";
    inp.onchange = (ev) => {
      const f = (ev.target as HTMLInputElement).files?.[0];
      if (f) setBriefFile(f);
    };
    inp.click();
  };

  const handleGenerate = async () => {
    if (!selectedClientId) {
      toast("Please select a client", "error");
      return;
    }
    if (!briefFile && !instructions.trim()) {
      toast("Please upload a brief or add instructions", "error");
      return;
    }

    setGenerating(true);
    setResults([]);

    try {
      // Step 1: If there's a brief PDF, upload it to brand context docs
      let briefContext = "";
      if (briefFile) {
        setBriefUploading(true);
        // For now, we extract the file name as context
        // In a full implementation, we'd parse the PDF server-side
        briefContext = `Brief document: ${briefFile.name}. `;
        setBriefUploading(false);
      }

      // Step 2: Build the generation prompt from brief + instructions
      const fullPrompt = [
        briefContext,
        instructions.trim(),
      ]
        .filter(Boolean)
        .join("\n\n");

      // Step 3: Call the generate API
      const r = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClientId,
          prompt: fullPrompt,
          mode: "image",
        }),
      });

      if (r.ok) {
        const data = await r.json();
        if (data.output_url) {
          setResults([
            { url: data.output_url, concept: fullPrompt.slice(0, 80) },
          ]);
          toast("Image generated!", "success");
        }
      } else {
        const err = await r.json().catch(() => ({}));
        toast(err.error || "Generation failed", "error");
      }
    } catch {
      toast("Generation failed", "error");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-page">
      <div className="bg-header">
        <h1 className="bg-title">Brief Generator</h1>
        <p className="bg-subtitle">
          Upload a creative brief, select your client, and generate ad images.
        </p>
      </div>

      <div className="bg-form">
        {/* Client Selector */}
        <div className="bg-card">
          <h4 className="bg-card-title">1. SELECT CLIENT</h4>
          <select
            className="bg-select"
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
          >
            <option value="">Choose a client...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Brief Upload */}
        <div className="bg-card">
          <h4 className="bg-card-title">2. ATTACH BRIEF (PDF)</h4>
          {!briefFile ? (
            <div
              className={`bg-dropzone ${dragActive ? "bg-dropzone-active" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={handleFileSelect}
            >
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>📋</div>
              <p>Drag & drop your brief PDF or click to select</p>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 4 }}>
                Include headline, sub-copy, image direction, and assets
              </p>
            </div>
          ) : (
            <div className="bg-file-item">
              <span>📎</span>
              <span className="bg-file-name">{briefFile.name}</span>
              <button
                className="bg-file-remove"
                onClick={() => setBriefFile(null)}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-card">
          <h4 className="bg-card-title">3. ADDITIONAL INSTRUCTIONS</h4>
          <textarea
            className="bg-textarea"
            placeholder="Add any additional context here... e.g. 'This brief needs to be made for the new protein bar product. Use the lifestyle images from the brand assets. Focus on the hero shot with the headline overlaid.'"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={5}
          />
        </div>

        {/* Generate Button */}
        <button
          className="bg-generate-btn"
          onClick={handleGenerate}
          disabled={generating || !selectedClientId}
        >
          {generating
            ? briefUploading
              ? "Uploading brief..."
              : "Generating..."
            : "Generate from Brief"}
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-results">
          <h3 className="bg-results-title">Generated Results</h3>
          <div className="bg-results-grid">
            {results.map((r, i) => (
              <div key={i} className="bg-result-card">
                <img
                  src={r.url}
                  alt={r.concept}
                  className="bg-result-img"
                />
                <div className="bg-result-info">
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
                    {r.concept}...
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
