"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "../ui/ConfirmModal";

interface BatchControlsProps {
  runId: string;
  status: string;
  disabled: boolean;
  onStatusChange?: () => void;
}

export function BatchControls({
  runId,
  status,
  disabled,
  onStatusChange,
}: BatchControlsProps) {
  const router = useRouter();
  const [confirmStop, setConfirmStop] = useState(false);
  const [pausing, setPausing] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [cloning, setCloning] = useState(false);

  const handlePause = async () => {
    setPausing(true);
    try {
      await fetch(`/api/batch/${runId}/pause`, { method: "POST" });
      onStatusChange?.();
    } catch (error) {
      console.error("Error pausing batch:", error);
    } finally {
      setPausing(false);
    }
  };

  const handleStop = async () => {
    setStopping(true);
    try {
      await fetch(`/api/batch/${runId}/stop`, { method: "POST" });
      setConfirmStop(false);
      onStatusChange?.();
    } catch (error) {
      console.error("Error stopping batch:", error);
    } finally {
      setStopping(false);
    }
  };

  const handleClone = async () => {
    setCloning(true);
    try {
      const response = await fetch(`/api/batch/${runId}/clone`, {
        method: "POST",
      });
      if (response.ok) {
        const data = (await response.json()) as { run: { id: string } };
        router.push(`/batch/${data.run.id}`);
      }
    } catch (error) {
      console.error("Error cloning batch:", error);
    } finally {
      setCloning(false);
    }
  };

  return (
    <>
      <div className="controls-group">
        {status === "running" && (
          <button
            className="button button-secondary"
            onClick={handlePause}
            disabled={disabled || pausing}
          >
            {pausing ? "Pausing..." : "Pause"}
          </button>
        )}

        {status === "paused" && (
          <button
            className="button button-secondary"
            onClick={handlePause}
            disabled={disabled || pausing}
          >
            {pausing ? "Resuming..." : "Resume"}
          </button>
        )}

        <button
          className="button button-danger"
          onClick={() => setConfirmStop(true)}
          disabled={disabled || confirmStop || stopping}
        >
          Stop
        </button>

        <button
          className="button button-secondary"
          onClick={handleClone}
          disabled={disabled || cloning}
        >
          {cloning ? "Cloning..." : "Clone Run"}
        </button>
      </div>

      <ConfirmModal
        open={confirmStop}
        title="Stop Batch Run"
        description="Are you sure you want to stop this batch run? Items in progress will be cancelled."
        confirmLabel="Stop"
        variant="danger"
        onConfirm={handleStop}
        onCancel={() => setConfirmStop(false)}
      />
    </>
  );
}
