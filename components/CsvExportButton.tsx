"use client";

type HistoryItem = {
  id: string;
  created_at: string;
  status: string;
  prompt: string;
  output_url: string | null;
};

export default function CsvExportButton({ rows }: { rows: HistoryItem[] }) {
  const exportCsv = () => {
    const header = ["id", "created_at", "status", "prompt", "output_url"];
    const lines = rows.map((r) => [r.id, r.created_at, r.status, r.prompt.replaceAll('"', '""'), r.output_url || ""]);
    const csv = [header, ...lines].map((line) => line.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `adgen-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return <button onClick={exportCsv}>Export CSV</button>;
}
