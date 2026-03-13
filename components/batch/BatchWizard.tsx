"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Client, Profile, PromptPack, ReferenceImage } from "@/types/domain";
import { StepClient } from "./steps/StepClient";
import { StepMode } from "./steps/StepMode";
import { StepProfile } from "./steps/StepProfile";
import { StepPromptPack } from "./steps/StepPromptPack";
import { StepReferences } from "./steps/StepReferences";
import { StepReview } from "./steps/StepReview";

interface BatchWizardProps {
  clients: Client[];
  profiles: Profile[];
  promptPacks: PromptPack[];
  references: ReferenceImage[];
}

const STEPS = [
  { key: "client", label: "Client", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  { key: "mode", label: "Mode", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { key: "profile", label: "Profile", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
  { key: "pack", label: "Prompts", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
  { key: "refs", label: "References", icon: "M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z" },
  { key: "review", label: "Review", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
];

export function BatchWizard({
  clients,
  profiles,
  promptPacks,
  references,
}: BatchWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [clientId, setClientId] = useState<string | null>(null);
  const [mode, setMode] = useState<"image" | "video" | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [promptPackId, setPromptPackId] = useState<string | null>(null);
  const [referenceImageIds, setReferenceImageIds] = useState<string[]>([]);
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [resolution, setResolution] = useState("2K");
  const [quantity, setQuantity] = useState(5);
  const [launching, setLaunching] = useState(false);

  const canContinue = (): boolean => {
    switch (step) {
      case 1: return clientId !== null;
      case 2: return mode !== null;
      case 3: return profileId !== null;
      case 4: return promptPackId !== null;
      case 5: return true;
      case 6: return true;
      default: return false;
    }
  };

  const handleContinue = () => {
    if (canContinue() && step < 6) {
      setStep((step + 1) as 1 | 2 | 3 | 4 | 5 | 6);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as 1 | 2 | 3 | 4 | 5 | 6);
    }
  };

  const goToStep = (target: number) => {
    if (target < step) {
      setStep(target as 1 | 2 | 3 | 4 | 5 | 6);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !launching) {
        if (step < 6 && canContinue()) {
          handleContinue();
        } else if (step === 6) {
          handleLaunch();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [step, launching, canContinue]);

  const handleLaunch = async () => {
    if (!clientId || !profileId || !promptPackId) return;
    setLaunching(true);
    try {
      const response = await fetch("/api/smart-batch/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          profileId,
          promptPackId,
          referenceImageIds,
          aspectRatio,
          resolution,
          quantity,
        }),
      });
      if (!response.ok) throw new Error("Failed to create batch run");
      const data = (await response.json()) as { run: { id: string } };
      router.push(`/batch/${data.run.id}`);
    } catch (error) {
      console.error("Error launching batch:", error);
      setLaunching(false);
    }
  };

  const selectedClient = clients.find((c) => c.id === clientId);
  const selectedProfile = profiles.find((p) => p.id === profileId);
  const selectedPromptPack = promptPacks.find((pp) => pp.id === promptPackId);
  const clientReferences = references.filter((r) => r.client_id === clientId);
  const selectedReferences = references.filter((r) => referenceImageIds.includes(r.id));

  const getStepSummary = (idx: number): string | null => {
    if (idx >= step) return null;
    switch (idx) {
      case 0: return selectedClient?.name || null;
      case 1: return mode ? mode.charAt(0).toUpperCase() + mode.slice(1) : null;
      case 2: return selectedProfile?.name || null;
      case 3: return selectedPromptPack?.name || null;
      case 4: return referenceImageIds.length > 0 ? `${referenceImageIds.length} selected` : "None";
      default: return null;
    }
  };

  return (
    <div className="bw-page">
      <div className="bw-header">
        <div className="bw-header-left">
          <h1 className="bw-title">Create Batch Run</h1>
          <p className="bw-subtitle">Configure and launch your batch generation job</p>
        </div>
        <div className="bw-header-right">
          <span className="bw-step-counter">Step {step} of 6</span>
        </div>
      </div>

      <div className="bw-progress-track">
        <div className="bw-progress-fill" style={{ width: `${((step) / 6) * 100}%` }} />
      </div>

      <div className="bw-steps-nav">
        {STEPS.map((s, idx) => {
          const num = idx + 1;
          const isCompleted = num < step;
          const isCurrent = num === step;
          const summary = getStepSummary(idx);
          return (
            <button
              key={s.key}
              className={`bw-step-btn ${isCurrent ? "bw-step-current" : ""} ${isCompleted ? "bw-step-done" : ""} ${num > step ? "bw-step-future" : ""}`}
              onClick={() => goToStep(num)}
              disabled={num > step}
            >
              <span className="bw-step-num">
                {isCompleted ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                ) : num}
              </span>
              <span className="bw-step-label">{s.label}</span>
              {summary && <span className="bw-step-summary">{summary}</span>}
            </button>
          );
        })}
      </div>

      <div className="bw-content">
        {step === 1 && <StepClient clients={clients} selected={clientId} onSelect={setClientId} />}
        {step === 2 && <StepMode selected={mode} onSelect={setMode} />}
        {step === 3 && (
          <StepProfile
            profiles={profiles}
            mode={mode}
            selected={profileId}
            onSelect={setProfileId}
            aspectRatio={aspectRatio}
            onAspectRatioChange={setAspectRatio}
            resolution={resolution}
            onResolutionChange={setResolution}
          />
        )}
        {step === 4 && <StepPromptPack promptPacks={promptPacks} selected={promptPackId} onSelect={setPromptPackId} />}
        {step === 5 && <StepReferences references={clientReferences} selected={referenceImageIds} onSelect={setReferenceImageIds} />}
        {step === 6 && (
          <StepReview
            client={selectedClient}
            mode={mode}
            profile={selectedProfile}
            promptPack={selectedPromptPack}
            references={selectedReferences}
            quantity={quantity}
            onQuantityChange={setQuantity}
            onLaunch={handleLaunch}
            launching={launching}
          />
        )}
      </div>

      <div className="bw-footer">
        <button className="bw-btn bw-btn-secondary" onClick={handleBack} disabled={step === 1}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>
        <div className="bw-footer-right">
          {step < 6 ? (
            <button className="bw-btn bw-btn-primary" onClick={handleContinue} disabled={!canContinue()}>
              Continue
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          ) : (
            <button className="bw-btn bw-btn-launch" onClick={handleLaunch} disabled={launching}>
              {launching ? (
                <>
                  <span className="bw-spinner" />
                  Launching...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                  Launch Batch
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
