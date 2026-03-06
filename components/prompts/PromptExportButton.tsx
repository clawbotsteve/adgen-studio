"use client";

import type { PromptItem } from "@/types/domain";

interface PromptExportButtonProps {
  items: PromptItem[];
  packName: string;
}

export function PromptExportButton({ items, packName }: PromptExportButtonProps) {
  const exportAsJson = () => {
    const data = items.map((item) => ({
      concept: item.concept,
      prompt_text: item.prompt_text,
      tags: item.tags,
    }));

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${packName}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsCsv = () => {
    const header = ["concept", "prompt_text", "tags"];
    const lines = items.map((item) => [
      item.concept,
      item.prompt_text.replaceAll('"', '""'),
      (item.tags || []).join("|"),
    ]);

    const csv = [header, ...lines]
      .map((line) => line.map((v) => `"${v}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${packName}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button onClick={exportAsJson}>Export as JSON</button>
      <button onClick={exportAsCsv}>Export as CSV</button>
    </div>
  );
}
