"use client";

import { useState, useEffect } from "react";

type PerformanceSummary = {
  totalImpressions: number;
  totalClicks: number;
  avgCtr: number;
  totalSpend: number;
  avgCpa: number;
  avgRoas: number;
  records: Array<{
    id: string;
    variant_id: string;
    platform: string | null;
    campaign_name: string | null;
    impressions: number;
    clicks: number;
    ctr: number | null;
    spend_usd: number | null;
    cpa_usd: number | null;
    roas: number | null;
    captured_at: string;
  }>;
};

export function PerformanceTab({ brandId }: { brandId: string }) {
  const [summary, setSummary] = useState<PerformanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerformance = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/ugc/performance/summary?brandId=${brandId}`);
        const json = await res.json();
        setSummary(json.summary ?? null);
      } catch (err) {
        console.error("Failed to fetch performance:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPerformance();
  }, [brandId]);

  if (loading) return <div className="ugc-empty-state">Loading performance data...</div>;
  if (!summary) return <div className="ugc-empty-state">No performance data available.</div>;

  return (
    <div>
      <div className="ugc-section-header">
        <h3>Performance</h3>
      </div>

      <div className="ugc-kpi-grid" style={{ marginBottom: 24 }}>
        <div className="ugc-kpi-card">
          <span className="ugc-kpi-label">Impressions</span>
          <span className="ugc-kpi-value">{summary.totalImpressions.toLocaleString()}</span>
        </div>
        <div className="ugc-kpi-card">
          <span className="ugc-kpi-label">Clicks</span>
          <span className="ugc-kpi-value">{summary.totalClicks.toLocaleString()}</span>
        </div>
        <div className="ugc-kpi-card">
          <span className="ugc-kpi-label">CTR</span>
          <span className="ugc-kpi-value">{(summary.avgCtr * 100).toFixed(2)}%</span>
        </div>
        <div className="ugc-kpi-card">
          <span className="ugc-kpi-label">Total Spend</span>
          <span className="ugc-kpi-value">${summary.totalSpend.toFixed(2)}</span>
        </div>
        <div className="ugc-kpi-card">
          <span className="ugc-kpi-label">Avg CPA</span>
          <span className="ugc-kpi-value">${summary.avgCpa.toFixed(2)}</span>
        </div>
        <div className="ugc-kpi-card">
          <span className="ugc-kpi-label">Avg ROAS</span>
          <span className="ugc-kpi-value">{summary.avgRoas.toFixed(2)}x</span>
        </div>
      </div>

      {summary.records.length === 0 ? (
        <div className="ugc-empty-state">
          No performance records yet. Import data or wait for campaign metrics.
        </div>
      ) : (
        <div className="card">
          <div style={{ overflowX: "auto" }}>
            <table className="performance-table">
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Campaign</th>
                  <th>Impressions</th>
                  <th>Clicks</th>
                  <th>CTR</th>
                  <th>Spend</th>
                  <th>CPA</th>
                  <th>ROAS</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {summary.records.map((r) => (
                  <tr key={r.id}>
                    <td>{r.platform ?? "-"}</td>
                    <td>{r.campaign_name ?? "-"}</td>
                    <td>{r.impressions.toLocaleString()}</td>
                    <td>{r.clicks.toLocaleString()}</td>
                    <td>{r.ctr != null ? `${(r.ctr * 100).toFixed(2)}%` : "-"}</td>
                    <td>{r.spend_usd != null ? `$${r.spend_usd.toFixed(2)}` : "-"}</td>
                    <td>{r.cpa_usd != null ? `$${r.cpa_usd.toFixed(2)}` : "-"}</td>
                    <td>{r.roas != null ? `${r.roas.toFixed(2)}x` : "-"}</td>
                    <td>{new Date(r.captured_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
