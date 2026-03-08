"use client";

const RATES: Record<string, number> = {
  no_audio: 0.07,
  audio: 0.14,
  audio_voice: 0.168,
};

const MARKUP_PERCENT = 40;

export function PricingPreview({
  duration,
  audioTier,
}: {
  duration: number;
  audioTier: string;
}) {
  const rate = RATES[audioTier] ?? RATES.no_audio;
  const cost = duration * rate;
  const charge = cost * (1 + MARKUP_PERCENT / 100);
  const margin = charge - cost;

  return (
    <div className="pricing-preview">
      <div className="pricing-item">
        <span className="pricing-label">fal Cost</span>
        <span className="pricing-value">${cost.toFixed(4)}</span>
      </div>
      <div className="pricing-item">
        <span className="pricing-label">Client Charge</span>
        <span className="pricing-value">${charge.toFixed(4)}</span>
      </div>
      <div className="pricing-item">
        <span className="pricing-label">Margin</span>
        <span className="pricing-value pricing-margin">${margin.toFixed(4)}</span>
      </div>
    </div>
  );
}
