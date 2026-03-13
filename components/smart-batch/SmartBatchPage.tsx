"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Client, Profile, BrandContext } from "@/types/domain";

export function SmartBatchPage({
  clients,
  profiles,
}: {
  clients: Client[];
  profiles: Profile[];
}) {
  const router = useRouter();
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [profileId, setProfileId] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [resolution, setResolution] = useState("2K");
  const [quantity, setQuantity] = useState(5);
  const [brandContext, setBrandContext] = useState<BrandContext | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [topCreativesCount, setTopCreativesCount] = useState(0);
  const [topCreativePreviews, setTopCreativePreviews] = useState<
    { id: string; url: string }[]
  >([]);

  // Set initial profile
  useEffect(() => {
    if (profiles.length > 0 && !profileId) setProfileId(profiles[0].id);
  }, [profiles]);

  // Fetch brand context when client changes
  // Check both brand_context table and clients.defaults.formData
  const fetchBrandContext = useCallback(async (cid: string) => {
    setContextLoading(true);
    try {
      const res = await fetch(`/api/brand-context?clientId=${cid}`);
      const data = await res.json();
      if (data.context) {
        setBrandContext(data.context);
      } else {
        // Fallback: check if client has formData in defaults
        const clientRes = await fetch(`/api/clients`);
        const clientsData = await clientRes.json();
        const client = Array.isArray(clientsData)
          ? clientsData.find((c: { id: string }) => c.id === cid)
          : null;
        const hasFormData =
          client?.defaults?.formData &&
          typeof client.defaults.formData === "object" &&
          Object.values(client.defaults.formData).some(
            (v: unknown) => typeof v === "string" && v.trim().length > 0
          );
        // Set a minimal truthy object so context indicator shows green
        setBrandContext(hasFormData ? ({ id: "formData" } as BrandContext) : null);
      }
    } catch {
      setBrandContext(null);
    } finally {
      setContextLoading(false);
    }
  }, []);

  // Fetch saved top creatives count when client changes
  const fetchTopCreatives = useCallback(async (cid: string) => {
    try {
      const res = await fetch(`/api/top-creatives?clientId=${cid}`);
      if (res.ok) {
        const data = await res.json();
        const list = data?.creatives ?? (Array.isArray(data) ? data : []);
        setTopCreativesCount(list.length);
        setTopCreativePreviews(list.slice(0, 5).map((c: { id: string; url: string }) => ({ id: c.id, url: c.url })));
      } else {
        setTopCreativesCount(0);
        setTopCreativePreviews([]);
      }
    } catch {
      setTopCreativesCount(0);
      setTopCreativePreviews([]);
    }
  }, []);

  useEffect(() => {
    if (clientId) {
      fetchBrandContext(clientId);
      fetchTopCreatives(clientId);
    }
  }, [clientId, fetchBrandContext, fetchTopCreatives]);

  const selectedProfile = profiles.find((p) => p.id === profileId);
  const selectedClient = clients.find((c) => c.id === clientId);

  const canLaunch = clientId && profileId;

  const handleLaunch = async () => {
    if (!canLaunch) return;
    setLaunching(true);
    try {
      const res = await fetch("/api/smart-batch/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          profileId,
          aspectRatio,
          resolution,
          quantity,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/batch/${data.run.id}`);
      } else {
        const err = await res.json().catch(() => null);
        alert("Failed to create batch: " + (err?.error || "Unknown error"));
      }
    } catch {
      alert("Failed to create batch. Please try again.");
    } finally {
      setLaunching(false);
    }
  };

  const contextActive = brandContext && !contextLoading;

  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 900 }}>
      {/* Row 1: Client */}
      <div
        className="card"
        style={{ padding: "12px 16px" }}
      >
        <div>
          <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>
            Client
          </label>
          <select
            className="form-select"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            style={{ padding: "6px 10px", fontSize: 13 }}
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        {selectedClient?.description && (
          <p
            style={{
              fontSize: 11,
              color: "var(--color-text-secondary)",
              margin: "6px 0 0",
            }}
          >
            {selectedClient.description}
          </p>
        )}
        {contextActive && (
          <p
            style={{
              fontSize: 11,
              color: "var(--color-success, #22c55e)",
              margin: "4px 0 0",
            }}
          >
            Brand context loaded — prompts will be generated from client data
          </p>
        )}
        {!contextActive && !contextLoading && clientId && (
          <p
            style={{
              fontSize: 11,
              color: "var(--color-warning, #f59e0b)",
              margin: "4px 0 0",
            }}
          >
            No brand context found — complete Client Generator first for best results
          </p>
        )}
      </div>

      {/* Row 2: Generation Settings — all in one tight row */}
      <div
        className="card"
        style={{ padding: "12px 16px" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
            gap: 10,
            alignItems: "end",
          }}
        >
          <div>
            <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>
              Profile
            </label>
            <select
              className="form-select"
              value={profileId}
              onChange={(e) => setProfileId(e.target.value)}
              style={{ padding: "6px 10px", fontSize: 13 }}
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>
              Aspect Ratio
            </label>
            <select
              className="form-select"
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              style={{ padding: "6px 10px", fontSize: 13 }}
            >
              <option value="1:1">1:1</option>
              <option value="9:16">9:16</option>
              <option value="16:9">16:9</option>
            </select>
          </div>
          <div>
            <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>
              Resolution
            </label>
            <select
              className="form-select"
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              style={{ padding: "6px 10px", fontSize: 13 }}
            >
              <option value="1K">1K</option>
              <option value="2K">2K</option>
              <option value="4K">4K</option>
            </select>
          </div>
          <div>
            <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>
              Quantity
            </label>
            <select
              className="form-select"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              style={{ padding: "6px 10px", fontSize: 13 }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <span
              style={{
                fontSize: 11,
                color: "var(--color-text-secondary)",
                padding: "8px 0",
              }}
            >
              {selectedProfile
                ? `${selectedProfile.mode} · ${selectedProfile.aspect_ratio} · ${selectedProfile.resolution}`
                : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Row 3: Reference Images (from saved Top Creatives) */}
      <div
        className="card"
        style={{ padding: "12px 16px" }}
      >
        <label className="form-label" style={{ margin: 0, fontSize: 12, marginBottom: topCreativePreviews.length > 0 ? 10 : 0 }}>
          Reference Images{" "}
          <span style={{ color: "var(--color-text-secondary)", fontWeight: 400 }}>
            (from Client Generator top creatives)
          </span>
        </label>

        {topCreativesCount > 0 ? (
          <>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              {topCreativePreviews.map((tc) => (
                <div
                  key={tc.id}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 6,
                    overflow: "hidden",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <img
                    src={tc.url}
                    alt="Top creative"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              ))}
              {topCreativesCount > 5 && (
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 6,
                    border: "1px solid var(--color-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    color: "var(--color-text-secondary)",
                  }}
                >
                  +{topCreativesCount - 5}
                </div>
              )}
            </div>
            <p
              style={{
                fontSize: 11,
                color: "var(--color-success, #22c55e)",
                margin: "8px 0 0",
              }}
            >
              {topCreativesCount} saved reference image{topCreativesCount !== 1 ? "s" : ""} will be used during generation
            </p>
          </>
        ) : (
          <div
            style={{
              border: "1px dashed var(--color-border)",
              borderRadius: 6,
              padding: "14px 0",
              textAlign: "center",
              color: "var(--color-text-secondary)",
              fontSize: 12,
              marginTop: 8,
            }}
          >
            No reference images saved. Upload top creatives in Client Generator for best results.
          </div>
        )}
      </div>

      {/* Row 4: Launch bar */}
      <div
        className="card"
        style={{
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <span style={{ fontWeight: 600, fontSize: 14 }}>
            {quantity} images
          </span>
          <span
            style={{
              fontSize: 12,
              color: "var(--color-text-secondary)",
              marginLeft: 8,
            }}
          >
            {contextActive ? "Brand context active" : "No brand context"}
            {topCreativesCount > 0
              ? ` · ${topCreativesCount} ref image${topCreativesCount > 1 ? "s" : ""}`
              : " · No ref images"}
          </span>
        </div>
        <button
          className="button button-primary"
          onClick={handleLaunch}
          disabled={!canLaunch || launching}
          style={{ minWidth: 140, padding: "8px 20px", fontSize: 13 }}
        >
          {launching ? "Generating..." : "Generate Batch"}
        </button>
      </div>
    </div>
  );
}
