"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable, type TableColumn } from "@/components/ui/DataTable";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/lib/hooks/useToast";
import type { Profile } from "@/types/domain";

interface ProfileTableProps {
  profiles: Profile[];
}

export function ProfileTable({ profiles }: ProfileTableProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = (profileId: string) => {
    setSelectedProfileId(profileId);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedProfileId) return;
    setIsLoading(true);

    try {
      const res = await fetch(`/api/profiles/${selectedProfileId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        addToast("Failed to delete profile", "error");
        return;
      }

      addToast("Profile deleted successfully", "success");
      setConfirmOpen(false);
      router.refresh();
    } catch (error) {
      addToast("An error occurred", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const columns: TableColumn<Profile>[] = [
    { key: "name", label: "Name" },
    {
      key: "mode",
      label: "Mode",
      render: (value) => (
        <StatusBadge
          status={value === "image" ? "completed" : "processing"}
        />
      ),
    },
    {
      key: "aspect_ratio",
      label: "Aspect Ratio",
    },
    {
      key: "resolution",
      label: "Resolution",
    },
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
      render: (value) => (
        <button
          onClick={() => handleDelete(value as string)}
          className="link link-danger"
          style={{ border: "none", background: "none", cursor: "pointer" }}
        >
          Delete
        </button>
      ),
    },
  ];

  return (
    <>
      <DataTable columns={columns} data={profiles} emptyMessage="No profiles yet" />
      <ConfirmModal
        open={confirmOpen}
        title="Delete Profile"
        description="Are you sure you want to delete this profile? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setSelectedProfileId(null);
        }}
      />
    </>
  );
}
