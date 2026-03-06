import { useState } from "react";
import { requireUserTenantPage } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { ClientForm } from "@/components/clients/ClientForm";
import { ClientList } from "@/components/clients/ClientList";
import { listClients } from "@/lib/data/clients";

export default async function ClientsPage() {
  const { tenant } = await requireUserTenantPage();
  const clients = await listClients(tenant.id);

  return (
    <div className="page-container">
      <PageHeader
        title="Clients"
        description="Manage your clients and their reference materials"
      />
      <div style={{ display: "grid", gap: 24 }}>
        <ClientForm />
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Clients List</h3>
          <ClientList clients={clients} />
        </div>
      </div>
    </div>
  );
}
