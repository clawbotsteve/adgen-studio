"use client";

interface StepModeProps {
  selected: "image" | "video" | null;
  onSelect: (mode: "image" | "video") => void;
}

export function StepMode({ selected, onSelect }: StepModeProps) {
  return (
    <div className="bw-step">
      <div className="bw-step-header">
        <h2 className="bw-step-title">Select Generation Mode</h2>
        <p className="bw-step-desc">Choose whether to generate images or videos for this batch.</p>
      </div>

      <div className="bw-mode-grid">
        <button
          className={`bw-mode-card ${selected === "image" ? "bw-selected" : ""}`}
          onClick={() => onSelect("image")}
        >
          <div className="bw-mode-icon bw-mode-icon-image">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </div>
          <h3 className="bw-mode-title">Image Generation</h3>
          <p className="bw-mode-desc">Generate high-quality static images using AI models</p>
          <span className="bw-mode-endpoint">fal-ai/nano-banana-2/edit</span>
          {selected === "image" && (
            <div className="bw-card-check">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          )}
        </button>

        <button
          className={`bw-mode-card ${selected === "video" ? "bw-selected" : ""}`}
          onClick={() => onSelect("video")}
        >
          <div className="bw-mode-icon bw-mode-icon-video">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
          </div>
          <h3 className="bw-mode-title">Video Generation</h3>
          <p className="bw-mode-desc">Create dynamic video content with AI-powered generation</p>
          <span className="bw-mode-endpoint">fal-ai/kling-video/v2.6/pro</span>
          {selected === "video" && (
            <div className="bw-card-check">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
