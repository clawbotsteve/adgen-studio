"use client";

import { useToastContext } from "@/components/ui/ToastProvider";

export type ToastType = "success" | "error" | "info" | "warning";

export function useToast() {
  const { addToast } = useToastContext();

  return {
    addToast: (message: string, type: ToastType) => {
      addToast(message, type);
    },
  };
}
