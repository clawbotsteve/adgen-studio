"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Brand } from "@/types/domain";

export default function GenerateForm({ brands }: { brands: Brand[] }) {
  const router = useRouter();
  const [brandId, setBrandId] = useState(brands[0]?.id || "");
  const [prompt, setPrompt] = useState("");
  const [referenceImageUrl, setReferenceImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandId, prompt, referenceImageUrl: referenceImageUrl || undefined }),
    });
    const json = (await res.json()) as { outputUrl?: string; error?: string };

    if (!res.ok) {
      setResult(json.error || "Generation failed.");
      setLoading(false);
      return;
    }

    setResult(json.outputUrl || "Completed.");
    setLoading(false);
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="card" style={{ display: "grid", gap: 10 }}>
      <h3 style={{ marginTop: 0 }}>Generate ad creative</h3>
      <select value={brandId} onChange={(e) => setBrandId(e.target.value)} required>
        {brands.map((b) => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>
      <textarea placeholder="Describe the ad concept" value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} required />
      <input placeholder="Reference image URL (optional)" value={referenceImageUrl} onChange={(e) => setReferenceImageUrl(e.target.value)} />
      <button disabled={loading} type="submit">{loading ? "Generating..." : "Generate"}</button>
      {result && (result.startsWith("http") ? <a href={result} target="_blank">Open result</a> : <p className="error">{result}</p>)}
    </form>
  );
}
