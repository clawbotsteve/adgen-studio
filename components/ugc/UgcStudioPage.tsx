"use client";

import { useState, useEffect, useCallback } from "react";
import type { Client, Brand } from "@/types/domain";
import type { UgcConcept, UgcVariant } from "@/types/ugc";
import { ConceptsTab } from "./ConceptsTab";
import { BriefBuilderTab } from "./BriefBuilderTab";
import { VariantLabTab } from "./VariantLabTab";
import { ApprovalsTab } from "./ApprovalsTab";
import { DistributionTab } from "./DistributionTab";
import { PerformanceTab } from "./PerformanceTab";
import { AvatarsVoicesTab } from "./AvatarsVoicesTab";

type Tab = "concepts" | "brief" | "variants" | "approvals" | "distribution" | "performance" | "avatars";

const TABS: { key: Tab; label: string }[] = [
  { key: "concepts", label: "Concepts" }, { key: "brief", label: "Brief Builder" },
  { key: "variants", label: "Variant Lab" }, { key: "approvals", label: "Approvals" },
  { key: "distribution", label: "Distribution" }, { key: "performance", label: "Performance" },
  { key: "avatars", label: "Avatars & Voices" },
];

export function UgcStudioPage({ clients, brands }: { clients: Client[]; brands: Brand[] }) {
  const [selectedBrandId, setSelectedBrandId] = useState(brands[0]?.id ?? "");
  const [activeTab, setActiveTab] = useState<Tab>("concepts");
  const [concepts, setConcepts] = useState<UgcConcept[]>([]);
  const [variants, setVariants] = useState<UgcVariant[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<UgcConcept | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalConcepts: 0, totalVariants: 0, pendingApprovals: 0, totalSpend: 0 });

  const fetchConcepts = useCallback(async () => {
    if (!selectedBrandId) return; setLoading(true);
    try { const res = await fetch(`/api/ugc/concepts?brandId=${selectedBrandId}`); const json = await res.json(); setConcepts(json.concepts ?? []); setStats((s) => ({ ...s, totalConcepts: (json.concepts ?? []).length })); } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [selectedBrandId]);

  const fetchVariants = useCallback(async () => {
    try { const res = await fetch(`/api/ugc/variants`); const json = await res.json(); const all = (json.variants ?? []) as UgcVariant[]; setVariants(all); setStats((s) => ({ ...s, totalVariants: all.length, pendingApprovals: all.filter((v) => v.status === "generated").length, totalSpend: all.reduce((sum, v) => sum + (v.fal_cost_usd ?? 0), 0) })); } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { fetchConcepts(); fetchVariants(); }, [fetchConcepts, fetchVariants]);

  return (<div className="ugc-studio"><div className="ugc-header"><div className="ugc-brand-selector"><label className="form-label">Brand</label><select className="form-select" value={selectedBrandId} onChange={(e) => setSelectedBrandId(e.target.value)}>{brands.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}</select></div><div className="ugc-kpi-grid"><div className="ugc-kpi-card"><span className="ugc-kpi-label">Concepts</span><span className="ugc-kpi-value">{stats.totalConcepts}</span></div><div className="ugc-kpi-card"><span className="ugc-kpi-label">Variants</span><span className="ugc-kpi-value">{stats.totalVariants}</span></div><div className="ugc-kpi-card"><span className="ugc-kpi-label">Pending</span><span className="ugc-kpi-value">{stats.pendingApprovals}</span></div><div className="ugc-kpi-card"><span className="ugc-kpi-label">Spend</span><span className="ugc-kpi-value">${stats.totalSpend.toFixed(2)}</span></div></div></div><div className="ugc-tabs">{TABS.map((tab) => (<button key={tab.key} className={`ugc-tab ${activeTab === tab.key ? "active" : ""}`} onClick={() => setActiveTab(tab.key)}>{tab.label}</button>))}</div><div className="ugc-tab-content">{activeTab==="concepts"&&<ConceptsTab brandId={selectedBrandId} concepts={concepts} loading={loading} onSelect={(c)=>{setSelectedConcept(c);setActiveTab("brief")}} onCreated={fetchConcepts}/>}{activeTab==="brief"&&<BriefBuilderTab concept={selectedConcept} onUpdated={fetchConcepts}/>}{activeTab==="variants"&&<VariantLabTab brandId={selectedBrandId} concepts={concepts} variants={variants} onCreated={fetchVariants}/>}{activeTab==="approvals"&&<ApprovalsTab variants={variants.filter(v=>v.status==="generated")} onDone={fetchVariants}/>}{activeTab==="distribution"&&<DistributionTab variants={variants.filter(v=>v.status==="approved")} onDistributed={fetchVariants}/>}{activeTab==="performance"&&<PerformanceTab brandId={selectedBrandId}/>}{activeTab==="avatars"&&<AvatarsVoicesTab brandId={selectedBrandId}/>}</div></div>);
}
