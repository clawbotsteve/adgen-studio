"use client";

import { useRouter } from "next/navigation";
import { AssetGrid } from "@/components/batch/AssetGrid";
import { useToast } from "@/lib/hooks/useToast";
import type { BatchItemResult } from "@/types/domain";

interface OutputsPageClientProps {
  items: BatchItemResult[];
  batchRunId: string;
}

export function OutputsPageClient({ items, batchRunId }: OutputsPageClientProps) {
  const router = useRouter();
  const { addToast } = useToast();

  const handleRetryItem = async (itemId: string, editedPrompt?: string) => {
    try {
      const body: Record<string, string> = {};
      if (editedPrompt) body.edited_prompt = editedPrompt;

      const res = await fetch(
        `/api/batch/${batchRunId}/items/${itemId}/retry`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Retry failed");
      }

      addToast("Item queued for retry", "success");
      router.refresh();
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Failed to retry item",
        "error"
      );
    }
  };

  const handleBulkRetry = async (itemIds: string[]) => {
    try {
      let retried = 0;
      for (const itemId of itemIds) {
        const res = await fetch(
          `/api/batch/${batchRunId}/items/${itemId}/retry`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "{}",
          }
        );
        if (res.ok) retried++;
      }

      addToast(`${retried} item${retried !== 1 ? "s" : ""} queued for retry`, "success");
      router.refresh();
    } catch (err) {
      addToast("Failed to retry items", "error");
    }
  };

  return (
    <AssetGrid
      items={items}
      batchRunId={batchRunId}
      onRetryItem={handleRetryItem}
      onBulkRetry={handleBulkRetry}
    />
  );
}
