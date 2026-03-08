"use client";

import { useState, useEffect, useCallback } from "react";
import type { Client } from "@/types/domain";
import type { UgcConcept, UgcVariant } from "@/types/ugc";
import { ConceptsTab } from "./ConceptsTab";
import { BriefBuilderTab } from "./BriefBuilderTab";
import { VariantLabTab } from "./VariantLabTab";
import { ApprovalsTab } from "./ApprovalsTab";
import { DistributionTab } from "./DistributionTab";
import { PerformanceTab } from "./PerformanceTab";
import { AvatarsVoicesTab } from "./AvatarsVoicesTab";

type Tab =
  | "concepts"
  | "brief"
  | "variants"
  | "approvals"
  | "distribution"
  | "performance"
  | "avatars";

const TABS: { key: Tab; label: string }[] = [
  { key: "concepts", label: "Concepts" },
  { key: "brief", label: "Brief Builder" },
  { key: "variants", label: "Variant Lab" },
  { key: "approvals", label: "Approvals" },
  { key: "distribution", label: "Distribution" },
  { key: "performance", label: "Performance" },
  { key: "avatars", label: "Avatars & Voices" },
];

export function UgcStudioPage({
  clients,
}: {
  clients: Client[];
}) {
  const [selectedBrandId, setSelectedBrandId] = useState(clients[0]?.id ?? "");
  const [activeTab, setActiveTab] = useState<Tab>("concepts");
  const [concepts, setConcepts] = useState<UgcConcept[]>([]);
  const [variants, setVariants] = useState<UgcVariant[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<UgcConcept | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalConcepts: 0,
    totalVariants: 0,
    pendingApprovals: 0,
    totalSpend: 0,
  });

  const fetchConcepts = useCallback(async () => {
    if (!selectedBrandId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/ugc/concepts?brandId=${selectedBrandId}`);
      const json = await res.json();
      setConcepts(json.concepts ?? []);
      setStats((s) => ({ ...s, totalConcepts: (json.concepts ?? []).length }));
    } catch (err) {
      console.error("Failed to fetch concepts:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedBrandId]);

  const fetchVariants = useCallback(async () => {
    try {
      const res = await fetch(`/api/ugc/variants`);
      const json = await res.json();
      const all = (json.variants ?? []) as UgcVariant[];
      setVariants(all);
      setStats((s) => ({
        ...s,
        totalVariants: all.length,
        pendingApprovals: all.filter((v) => v.status === "generated").length,
        totalSpend: all.reduce((sum, v) => sum + (v.fal_cost_usd ?? 0), 0),
      }));
    } catch (err) {
      console.error("Failed to fetch variants:", err);
    }
  }, []);

  useEffect(() => {
    fetchConcepts();
    fetchVariants();
  }, [fetchConcepts, fetchVariants]);

  const handleConceptSelect = (concept: UgcConcept) => {
    setSelectedConcept(concept);
    setActiveTab("brief");
  };

  const handleConceptCreated = () => {
    fetchConcepts();
  };

  const handleVariantCreated = () => {
    fetchVariants();
  };

  const handleApprovalDone = () => {
    fetchVariants();
  };

  return (
    <div className="ugc-studio">
      {/* Brand selector + KPI row */}
      <div className="ugc-header">
        <div className="ugc-brand-selector">
          <label className="form-label">Client</label>
          <select
            className="form-select"
            value={selectedBrandId}
            onChange={(e) => setSelectedBrandId(e.target.value)}
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="ugc-kpi-grid">
          <div className="ugc-kpi-card">
            <span className="ugc-kpi-label">Concepts</span>
            <span className="ugc-kpi-value">{stats.totalConcepts}</span>
          </div>
          <div className="ugc-kpi-card">
            <span className="ugc-kpi-label">Variants</span>
            <span className="ugc-kpi-value">{stats.totalVariants}</span>
          </div>
          <div className="ugc-kpi-card">
            <span className="ugc-kpi-label">Pending</span>
            <span className="ugc-kpi-value">{stats.pendingApprovals}</span>
          </div>
          <div className="ugc-kpi-card">
            <span className="ugc-kpi-label">Spend</span>
            <span className="ugc-kpi-value">
              ${stats.totalSpend.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="ugc-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`ugc-tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="ugc-tab-content">
        {activeTab === "concepts" && (
          <ConceptsTab
            brandId={selectedBrandId}
            concepts={concepts}
            loading={loading}
            onSelect={handleConceptSelect}
            onCreated={handleConceptCreated}
          />
        )}
        {activeTab === "brief" && (
          <BriefBuilderTab
            concept={selectedConcept}
            onUpdated={fetchConcepts}
          />
        )}
        {activeTab === "variants" && (
          <VariantLabTab
            brandId={selectedBrandId}
            concepts={concepts}
            variants={variants}
            onCreated={handleVariantCreated}
          />
        )}
        {activeTab === "approvals" && (
          <ApprovalsTab
            variants={variants.filter(
              (v) => v.status === "generated"
            )}
            onDone={handleApprovalDone}
          />
        )}
        {activeTab === "distribution" && (
          <DistributionTab
            variants={variants.filter(
              (v) => v.status === "approved"
            )}
            onDistributed={fetchVariants}
          />
        )}
        {activeTab === "performance" && (
          <PerformanceTab brandId={selectedBrandId} />
        )}
        {activeTab === "avatars" && (
          <AvatarsVoicesTab brandId={selectedBrandId} />
        )}
      </div>
    </div>
  );
}
