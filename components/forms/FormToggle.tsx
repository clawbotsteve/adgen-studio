"use client";

interface FormToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}

export function FormToggle({
  checked,
  onChange,
  label,
  description,
}: FormToggleProps) {
  return (
    <div>
      <label className="toggle-switch">
        <input
          type="checkbox"
          className="toggle-switch-input"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="toggle-switch-label">{label}</span>
      </label>
      {description && (
        <div className="toggle-switch-description">{description}</div>
      )}
    </div>
  );
}
