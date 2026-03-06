"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BrandForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [voice, setVoice] = useState("");
  const [driveFolderId, setDriveFolderId] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const res = await fetch("/api/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, voice, driveFolderId }),
    });

    if (!res.ok) {
      setMessage("Unable to create brand.");
      return;
    }

    setMessage("Brand created.");
    setName("");
    setVoice("");
    setDriveFolderId("");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="card" style={{ display: "grid", gap: 8 }}>
      <h3 style={{ marginTop: 0 }}>Add brand</h3>
      <input placeholder="Brand name" value={name} onChange={(e) => setName(e.target.value)} required />
      <input placeholder="Brand voice (optional)" value={voice} onChange={(e) => setVoice(e.target.value)} />
      <input placeholder="Drive folder ID (optional)" value={driveFolderId} onChange={(e) => setDriveFolderId(e.target.value)} />
      <button type="submit">Create brand</button>
      {message && <p>{message}</p>}
    </form>
  );
}
