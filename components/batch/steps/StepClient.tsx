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
    <div className="wizard-step">
      <div className="step-header">
        <h2>Select a Client</h2>
        <p>Choose the client for this batch run.</p>
      </div>

      <div className="step-search">
        <input
          type="text"
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input"
        />
      </div>

      <div className="step-options">
        {filtered.length === 0 ? (
          <div className="empty-options">
            <p>No clients found. Create one first.</p>
          </div>
        ) : (
          filtered.map((client) => (
            <div
              key={client.id}
              className={`option-card ${selected === client.id ? "selected" : ""}`}
              onClick={() => onSelect(client.id)}
            >
              <div className="option-title">{client.name}</div>
              {client.description && (
                <div className="option-description">{client.description}</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
