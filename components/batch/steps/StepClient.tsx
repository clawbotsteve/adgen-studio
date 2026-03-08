"use client";

import { useState } from "react";
import type { Client } from "@/types/domain";

interface StepClientProps {
  clients: Client[];
  selected: string | null;
  onSelect: (clientId: string) => void;
}

export function StepClient({ clients, selected, onSelect }: StepClientProps) {
  const [search, setSearch] = useState("");

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bw-step">
      <div className="bw-step-header">
        <h2 className="bw-step-title">Select a Client</h2>
        <p className="bw-step-desc">Choose which client this batch run is for.</p>
      </div>

      <div className="bw-search-wrap">
        <svg className="bw-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          type="text"
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bw-search-input"
        />
      </div>

      <div className="bw-card-grid bw-card-grid-2">
        {filtered.length === 0 ? (
          <div className="bw-empty">
            <p>No clients found. Create one first.</p>
          </div>
        ) : (
          filtered.map((client) => (
            <button
              key={client.id}
              className={`bw-select-card ${selected === client.id ? "bw-selected" : ""}`}
              onClick={() => onSelect(client.id)}
            >
              <div className="bw-card-avatar">
                {client.name.charAt(0).toUpperCase()}
              </div>
              <div className="bw-card-info">
                <span className="bw-card-name">{client.name}</span>
                {client.description && (
                  <span className="bw-card-desc">{client.description}</span>
                )}
              </div>
              {selected === client.id && (
                <div className="bw-card-check">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
