"use client";

interface StepModeProps {
  selected: "image" | "video" | null;
  onSelect: (mode: "image" | "video") => void;
}

export function StepMode({ selected, onSelect }: StepModeProps) {
  return (
    <div className="wizard-step">
      <div className="step-header">
        <h2>Select Generation Mode</h2>
        <p>Choose whether to generate images or videos.</p>
      </div>

      <div className="mode-cards">
        <div
          className={`mode-card ${selected === "image" ? "selected" : ""}`}
          onClick={() => onSelect("image")}
        >
          <div className="mode-icon">🖼️</div>
          <div className="mode-title">Image</div>
          <div className="mode-description">fal-ai/nano-banana-2/edit</div>
        </div>

        <div
          className={`mode-card ${selected === "video" ? "selected" : ""}`}
          onClick={() => onSelect("video")}
        >
          <div className="mode-icon">🎬</div>
          <div className="mode-title">Video</div>
          <div className="mode-description">fal-ai/kling-video/v2.6/pro</div>
        </div>
      </div>
    </div>
  );
}
