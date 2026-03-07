"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Client } from "@/types/domain";

interface RecentGeneration {
  id: string;
  prompt: string;
  output_url: string;
  aspect_ratio: string;
  resolution: string;
  created_at: string;
}

interface Stats {
  totalCount: number;
  thisMonthCount: number;
  referenceImageCount: number;
  lastGeneratedAt: string | null;
  recentGenerations: RecentGeneration[];
}

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "gallery", label: "Gallery" },
  { id: "settings", label: "Settings" },
  { id: "performance", label: "Performance" },
  { id: "billing", label: "Billing" },
] as const;

type TabId = typeof TABS[number]["id"];

interface ClientHubPageProps {
  clients: Client[];
}

export function ClientHubPage({ clients }: ClientHubPageProps) {
  const router = useRouter();
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id ?? "");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const fetchStats = useCallback(async (clientId: string) => {
    if (!clientId) return;
    setLoadingStats(true);
    setError(null);
    try {
      const res = await fetch(`/api/client-hub/${clientId}/stats`);
      if (!res.ok) throw new Error("Failed to load stats");
      const data = await res.json();
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const handleClientChange = useCallback((newClientId: string) => {
    setSelectedClientId(newClientId);
    setActiveTab("overview");
    fetchStats(newClientId);
  }, [fetchStats]);

  useEffect(() => {
    if (selectedClientId) fetchStats(selectedClientId);
  }, []);

  const handleDownload = useCallback(async (url: string, prompt: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      const safeName = prompt.slice(0, 30).replace(/[^a-zA-Z0-9]/g, "_");
      a.download = `adgen_${safeName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch { window.open(url, "_blank"); }
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateStr);
  };
  if (clients.length === 0) {
    return (
      <div className="client-hub">
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <h3 style={{ color: "#e2e8f0", marginBottom: "0.5rem" }}>No Clients Yet</h3>
          <p style={{ color: "#94a3b8", marginBottom: "1rem" }}>Create a client to start managing their creative operations.</p>
          <button className="btn btn-primary" onClick={() => router.push("/clients")}>Go to Clients</button>
        </div>
      </div>
    );
  }

  return (
    <div className="client-hub">
      {/* Preview Modal */}
      {previewUrl && (
        <div className="preview-modal-overlay" onClick={() => setPreviewUrl(null)}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <button className="preview-modal-close" onClick={() => setPreviewUrl(null)}>\u00d7</button>
            <img src={previewUrl} alt="Preview" />
          </div>
        </div>
      )}

      {/* Client Switcher */}
      <div className="client-hub-header">
        <div className="client-hub-switcher">
          <label htmlFor="hub-client-select">Client:</label>
          <select
            id="hub-client-select"
            value={selectedClientId}
            onChange={(e) => handleClientChange(e.target.value)}
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        {selectedClient && (
          <div className="client-hub-name">
            <h2>{selectedClient.name}</h2>
            {selectedClient.description && <p>{selectedClient.description}</p>}
          </div>
        )}
      </div>

      {error && (
        <div className="generate-error">
          <span>{error}</span>
          <button onClick={() => setError(null)}>\u00d7</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Total Generations</span>
          <span className="kpi-value">{loadingStats ? "..." : (stats?.totalCount ?? 0)}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">This Month</span>
          <span className="kpi-value">{loadingStats ? "..." : (stats?.thisMonthCount ?? 0)}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Reference Images</span>
          <span className="kpi-value">{loadingStats ? "..." : (stats?.referenceImageCount ?? 0)}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Last Generated</span>
          <span className="kpi-value kpi-value-sm">{loadingStats ? "..." : formatTime(stats?.lastGeneratedAt ?? null)}</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="hub-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`hub-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="hub-tab-content">
          <h3 className="hub-section-title">Recent Generations</h3>
          {loadingStats ? (
            <div className="coming-soon-tab"><div className="drop-zone-spinner" /> Loading...</div>
          ) : stats?.recentGenerations && stats.recentGenerations.length > 0 ? (
            <div className="recent-gen-grid">
              {stats.recentGenerations.map((gen) => (
                <div key={gen.id} className="gen-thumbnail" onClick={() => setPreviewUrl(gen.output_url)}>
                  <img src={gen.output_url} alt={gen.prompt} />
                  <div className="gen-thumbnail-info">
                    <span className="gen-thumb-prompt">{gen.prompt.length > 40 ? gen.prompt.slice(0, 40) + "..." : gen.prompt}</span>
                    <span className="gen-thumb-meta">{gen.aspect_ratio} \u00b7 {gen.resolution} \u00b7 {formatDate(gen.created_at)}</span>
                  </div>
                  <div className="gen-thumbnail-actions">
                    <button className="btn-icon" onClick={(e) => { e.stopPropagation(); handleDownload(gen.output_url, gen.prompt); }} title="Download">\u2B07</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="coming-soon-tab">
              <p>No generations yet for this client.</p>
              <button className="btn btn-primary" style={{ marginTop: "1rem" }} onClick={() => router.push("/batch/create")}>Generate First Image</button>
            </div>
          )}

          <div className="hub-quick-actions">
            <button className="btn btn-primary" onClick={() => router.push("/batch/create")}>
              \u25B6 Generate New
            </button>
            <button className="btn btn-secondary" disabled>
              View All in Gallery (Coming Soon)
            </button>
          </div>
        </div>
      )}

      {activeTab === "gallery" && (
        <div className="coming-soon-tab">
          <h3>Gallery</h3>
          <p>Full image gallery with filters, favorites, and bulk actions coming in Phase 2.</p>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="coming-soon-tab">
          <h3>Settings</h3>
          <p>Model configuration, brand rules, and integration settings coming in Phase 3.</p>
        </div>
      )}

      {activeTab === "performance" && (
        <div className="coming-soon-tab">
          <h3>Performance</h3>
          <p>Top prompts, cost analysis, and usage metrics coming in Phase 4.</p>
        </div>
      )}

      {activeTab === "billing" && (
        <div className="coming-soon-tab">
          <h3>Billing</h3>
          <p>Usage summaries, cost breakdowns, and invoice exports coming in Phase 5.</p>
        </div>
      )}
    </div>
  );
}