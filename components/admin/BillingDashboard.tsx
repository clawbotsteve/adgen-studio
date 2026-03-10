"use client";

import { useState, useMemo } from "react";

interface GenerationBreakdown {
  resolution: string;
  count: number;
  cost: number;
}

interface BillingItem {
  id: string;
  concept: string;
  resolution: string;
  cost: number;
  completedAt: string;
}

interface ClientUsage {
  clientId: string;
  clientName: string;
  totalCount: number;
  totalCost: number;
  generations: GenerationBreakdown[];
  items: BillingItem[];
}

interface BillingData {
  clients: ClientUsage[];
  grandTotal: number;
  grandCount: number;
  pricing: Record<string, number>;
}

interface BillingDashboardProps {
  data: BillingData;
}

function getBiweeklyPeriods(): { label: string; start: Date; end: Date }[] {
  const now = new Date();
  const periods = [];

  // Generate last 6 biweekly periods
  for (let i = 0; i < 6; i++) {
    const end = new Date(now);
    end.setDate(end.getDate() - i * 14);
    end.setHours(23, 59, 59, 999);

    const start = new Date(end);
    start.setDate(start.getDate() - 13);
    start.setHours(0, 0, 0, 0);

    const fmt = (d: Date) =>
      `${d.getMonth() + 1}/${d.getDate()}`;

    periods.push({
      label: `${fmt(start)} - ${fmt(end)}`,
      start,
      end,
    });
  }

  return periods;
}

export function BillingDashboard({ data }: BillingDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const periods = useMemo(() => getBiweeklyPeriods(), []);

  // Filter data by selected period
  const filteredData = useMemo(() => {
    if (selectedPeriod === "all") return data;

    const period = periods.find((p) => p.label === selectedPeriod);
    if (!period) return data;

    const filtered: ClientUsage[] = [];

    for (const client of data.clients) {
      const filteredItems = client.items.filter((item) => {
        const d = new Date(item.completedAt);
        return d >= period.start && d <= period.end;
      });

      if (filteredItems.length === 0) continue;

      // Rebuild generation breakdown
      const genMap: Record<string, { count: number; cost: number }> = {};
      let totalCost = 0;

      for (const item of filteredItems) {
        if (!genMap[item.resolution]) {
          genMap[item.resolution] = { count: 0, cost: 0 };
        }
        genMap[item.resolution].count++;
        genMap[item.resolution].cost += item.cost;
        totalCost += item.cost;
      }

      filtered.push({
        ...client,
        totalCount: filteredItems.length,
        totalCost,
        generations: Object.entries(genMap).map(([res, d]) => ({
          resolution: res,
          count: d.count,
          cost: d.cost,
        })),
        items: filteredItems,
      });
    }

    return {
      clients: filtered,
      grandTotal: filtered.reduce((s, c) => s + c.totalCost, 0),
      grandCount: filtered.reduce((s, c) => s + c.totalCount, 0),
      pricing: data.pricing,
    };
  }, [data, selectedPeriod, periods]);

  return (
    <div>
      {/* Pricing Reference */}
      <div className="card" style={{ marginBottom: 16, padding: "12px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Pricing Tiers
          </span>
          {Object.entries(data.pricing).map(([res, price]) => (
            <span key={res} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  background: res === "2K" ? "var(--color-accent)" : "var(--color-bg-tertiary)",
                  color: "white",
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                }}
              >
                {res}
              </span>
              <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                ${price.toFixed(2)}
              </span>
              {res === "2K" && (
                <span style={{ fontSize: "0.7rem", color: "var(--color-accent)", fontWeight: 500 }}>
                  RECOMMENDED
                </span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Period Selector + Summary Cards */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          style={{
            background: "var(--color-bg-secondary)",
            color: "var(--text-primary)",
            border: "1px solid var(--color-border)",
            borderRadius: 6,
            padding: "8px 12px",
            fontSize: "0.85rem",
          }}
        >
          <option value="all">All Time</option>
          {periods.map((p) => (
            <option key={p.label} value={p.label}>
              {p.label}
            </option>
          ))}
        </select>

        <div className="card" style={{ padding: "10px 20px", flex: "0 0 auto" }}>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Total Generations
          </div>
          <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-primary)" }}>
            {filteredData.grandCount}
          </div>
        </div>

        <div className="card" style={{ padding: "10px 20px", flex: "0 0 auto" }}>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Total to Bill
          </div>
          <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#22c55e" }}>
            ${filteredData.grandTotal.toFixed(2)}
          </div>
        </div>

        <div className="card" style={{ padding: "10px 20px", flex: "0 0 auto" }}>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Active Clients
          </div>
          <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-primary)" }}>
            {filteredData.clients.length}
          </div>
        </div>
      </div>

      {/* Client Billing Table */}
      {filteredData.clients.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ color: "var(--text-muted)" }}>
            No generations found for this period.
          </p>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Client</th>
                <th style={{ textAlign: "center" }}>1K</th>
                <th style={{ textAlign: "center" }}>2K</th>
                <th style={{ textAlign: "center" }}>4K</th>
                <th style={{ textAlign: "center" }}>Total Gens</th>
                <th style={{ textAlign: "right" }}>Amount Due</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredData.clients
                .sort((a, b) => b.totalCost - a.totalCost)
                .map((client) => {
                  const get1K = client.generations.find((g) => g.resolution === "1K");
                  const get2K = client.generations.find((g) => g.resolution === "2K");
                  const get4K = client.generations.find((g) => g.resolution === "4K");
                  const isExpanded = expandedClient === client.clientId;

                  return (
                    <tr key={client.clientId} style={{ cursor: "pointer" }}>
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                          {client.clientName}
                        </div>
                      </td>
                      <td style={{ textAlign: "center", color: get1K ? "var(--text-primary)" : "var(--text-muted)" }}>
                        {get1K ? get1K.count : "—"}
                      </td>
                      <td style={{ textAlign: "center", color: get2K ? "var(--text-primary)" : "var(--text-muted)" }}>
                        {get2K ? get2K.count : "—"}
                      </td>
                      <td style={{ textAlign: "center", color: get4K ? "var(--text-primary)" : "var(--text-muted)" }}>
                        {get4K ? get4K.count : "—"}
                      </td>
                      <td style={{ textAlign: "center", fontWeight: 600, color: "var(--text-primary)" }}>
                        {client.totalCount}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: "#22c55e", fontSize: "1rem" }}>
                        ${client.totalCost.toFixed(2)}
                      </td>
                      <td style={{ textAlign: "center", width: 40 }}>
                        <button
                          onClick={() =>
                            setExpandedClient(isExpanded ? null : client.clientId)
                          }
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--text-muted)",
                            cursor: "pointer",
                            fontSize: "1rem",
                            transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                            transition: "transform 0.2s",
                          }}
                        >
                          ▶
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "2px solid var(--color-border)" }}>
                <td style={{ fontWeight: 700, color: "var(--text-primary)" }}>TOTAL</td>
                <td></td>
                <td></td>
                <td></td>
                <td style={{ textAlign: "center", fontWeight: 700, color: "var(--text-primary)" }}>
                  {filteredData.grandCount}
                </td>
                <td style={{ textAlign: "right", fontWeight: 700, color: "#22c55e", fontSize: "1.1rem" }}>
                  ${filteredData.grandTotal.toFixed(2)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Expanded Client Detail */}
      {expandedClient && (
        <div className="card" style={{ marginTop: 12 }}>
          <h4 style={{ color: "var(--text-primary)", marginBottom: 12 }}>
            {filteredData.clients.find((c) => c.clientId === expandedClient)?.clientName} — Generation Details
          </h4>
          <div style={{ maxHeight: 300, overflow: "auto" }}>
            <table className="table" style={{ fontSize: "0.8rem" }}>
              <thead>
                <tr>
                  <th>Concept</th>
                  <th style={{ textAlign: "center" }}>Resolution</th>
                  <th style={{ textAlign: "right" }}>Cost</th>
                  <th style={{ textAlign: "right" }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.clients
                  .find((c) => c.clientId === expandedClient)
                  ?.items.map((item) => (
                    <tr key={item.id}>
                      <td style={{ color: "var(--text-primary)" }}>
                        {item.concept}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span
                          style={{
                            background:
                              item.resolution === "2K"
                                ? "var(--color-accent)"
                                : "var(--color-bg-tertiary)",
                            color: "white",
                            padding: "1px 6px",
                            borderRadius: 3,
                            fontSize: "0.7rem",
                            fontWeight: 600,
                          }}
                        >
                          {item.resolution}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", color: "#22c55e", fontWeight: 500 }}>
                        ${item.cost.toFixed(2)}
                      </td>
                      <td style={{ textAlign: "right", color: "var(--text-muted)" }}>
                        {new Date(item.completedAt).toLocaleDateString()}
                      </td>
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
