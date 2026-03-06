"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable, type TableColumn } from "@/components/ui/DataTable";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/lib/hooks/useToast";
import type { Client } from "@/types/domain";

interface ClientListProps {
  clients: Client[];
}

export function ClientList({ clients }: ClientListProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleArchive = (clientId: string) => {
    setSelectedClientId(clientId);
    setConfirmOpen(true);
  };

  const confirmArchive = async () => {
    if (!selectedClientId) return;
    setIsLoading(true);

    try {
      const res = await fetch(`/api/clients/${selectedClientId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        addToast("Failed to archive client", "error");
        return;
      }

      addToast("Client archived successfully", "success");
      setConfirmOpen(false);
      router.refresh();
    } catch (error) {
      addToast("An error occurred", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const columns: TableColumn<Client>[] = [
    { key: "name", label: "Name" },
    { key: "description", label: "Description" },
    {
      key: "created_at",
      label: "Created",
      render: (value) =>
        new Date(value as string).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
    },
    {
      key: "id",
      label: "Actions",
      render: (value, row) => (
        <div style={{ display: "flex", gap: 8 }}>
          <a href={`/clients/${value}`} className="link">
            Edit
          </a>
          <button
            onClick={() => handleArchive(value as string)}
            className="link link-danger"
            style={{ border: "none", background: "none", cursor: "pointer" }}
          >
            Archive
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable columns={columns} data={clients} emptyMessage="No clients yet" />
      <ConfirmModal
        open={confirmOpen}
        title="Archive Client"
        description="Are you sure you want to archive this client? This action can be reversed."
        confirmLabel="Archive"
        variant="danger"
        onConfirm={confirmArchive}
        onCancel={() => {
          setConfirmOpen(false);
          setSelectedClientId(null);
        }}
      />
    </>
  );
}
