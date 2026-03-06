"use client";

import { useRouter } from "next/navigation";
import { DataTable, type TableColumn } from "@/components/ui/DataTable";
import type { PromptPack } from "@/types/domain";

interface PromptPackTableProps {
  packs: PromptPack[];
}

export function PromptPackTable({ packs }: PromptPackTableProps) {
  const router = useRouter();

  const handleRowClick = (pack: PromptPack) => {
    router.push(`/prompt-packs/${pack.id}`);
  };

  const columns: TableColumn<PromptPack>[] = [
    {
      key: "name",
      label: "Name",
    },
    {
      key: "item_count",
      label: "Items",
      render: (value) => value || 0,
    },
    {
      key: "description",
      label: "Description",
      render: (value) => (value ? String(value) : "-"),
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
  ];

  return (
    <DataTable
      columns={columns}
      data={packs}
      onRowClick={handleRowClick}
      emptyMessage="No prompt packs yet"
    />
  );
}
