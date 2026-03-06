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
  const [launching, setLaunching] = useState(false);

  const steps = [
    "Client",
    "Mode",
    "Profile",
    "Prompt Pack",
    "References",
    "Review",
  ];

  // Validation for each step
  const isStep1Valid = clientId !== null;
  const isStep2Valid = mode !== null;
  const isStep3Valid = profileId !== null;
  const isStep4Valid = promptPackId !== null;
  const isStep5Valid = referenceImageIds.length > 0;

  const canContinue = (): boolean => {
    switch (step) {
      case 1:
        return isStep1Valid;
      case 2:
        return isStep2Valid;
      case 3:
        return isStep3Valid;
      case 4:
        return isStep4Valid;
      case 5:
        return isStep5Valid;
      case 6:
        return true;
      default:
        return false;
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

  // Handle Enter key for advancing steps
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
      const response = await fetch("/api/batch/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          profileId,
          promptPackId,
          referenceImageIds,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create batch run");
      }

      const data = (await response.json()) as { run: { id: string } };
      router.push(`/batch/${data.run.id}`);
    } catch (error) {
      console.error("Error launching batch:", error);
      setLaunching(false);
    }
  };

  // Get data for current step
  const selectedClient = clients.find((c) => c.id === clientId);
  const selectedProfile = profiles.find((p) => p.id === profileId);
  const selectedPromptPack = promptPacks.find((pp) => pp.id === promptPackId);
  const clientReferences = references.filter((r) => r.client_id === clientId);
  const selectedReferences = references.filter((r) =>
    referenceImageIds.includes(r.id)
  );

  return (
    <div className="batch-wizard">
      <div className="wizard-header">
        <h1>Create Batch Run</h1>
        <div className="wizard-progress">
          {steps.map((stepName, idx) => (
            <div
              key={idx}
              className={`progress-step ${
                idx + 1 <= step ? "active" : ""
              } ${idx + 1 === step ? "current" : ""}`}
            >
              <span className="progress-number">{idx + 1}</span>
              <span className="progress-label">{stepName}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="wizard-content">
        {step === 1 && (
          <StepClient clients={clients} selected={clientId} onSelect={setClientId} />
        )}
        {step === 2 && <StepMode selected={mode} onSelect={setMode} />}
        {step === 3 && (
          <StepProfile
            profiles={profiles}
            mode={mode}
            selected={profileId}
            onSelect={setProfileId}
          />
        )}
        {step === 4 && (
          <StepPromptPack
            promptPacks={promptPacks}
            selected={promptPackId}
            onSelect={setPromptPackId}
          />
        )}
        {step === 5 && (
          <StepReferences
            references={clientReferences}
            selected={referenceImageIds}
            onSelect={setReferenceImageIds}
          />
        )}
        {step === 6 && (
          <StepReview
            client={selectedClient}
            mode={mode}
            profile={selectedProfile}
            promptPack={selectedPromptPack}
            references={selectedReferences}
            onLaunch={handleLaunch}
            launching={launching}
          />
        )}
      </div>

      <div className="wizard-footer">
        <button
          className="button button-secondary"
          onClick={handleBack}
          disabled={step === 1}
        >
          Back
        </button>
        {step < 6 && (
          <button
            className="button"
            onClick={handleContinue}
            disabled={!canContinue()}
          >
            Continue
          </button>
        )}
        {step === 6 && (
          <button
            className="button"
            onClick={handleLaunch}
            disabled={launching}
          >
            {launching ? "Launching..." : "Launch Batch"}
          </button>
        )}
      </div>
    </div>
  );
}
