"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ErrorTable } from "@/components/batch/ErrorTable";
import { useToast } from "@/lib/hooks/useToast";
import type { BatchItemResult } from "@/types/domain";

interface ErrorsPageClientProps {
  errors: BatchItemResult[];
  batchRunId: string;
}

export function ErrorsPageClient({
  errors,
  batchRunId,
}: ErrorsPageClientProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetrySingle = async (
    itemId: string,
    editedPrompt?: string
  ) => {
    setIsRetrying(true);
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
    } finally {
      setIsRetrying(false);
    }
  };

  const handleRetryAll = async () => {
    setIsRetrying(true);
    try {
      const res = await fetch(
        `/api/batch/${batchRunId}/retry-failed`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Bulk retry failed");
      }

      const data = await res.json();
      addToast(data.message || "All failed items queued for retry", "success");
      router.refresh();
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Failed to retry items",
        "error"
      );
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <ErrorTable
      errors={errors}
      onRetrySingle={handleRetrySingle}
      onRetryAll={handleRetryAll}
      isRetrying={isRetrying}
    />
  );
}
