"use client";

interface FormTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
}

export function FormTextArea({
  value,
  onChange,
  placeholder,
  maxLength,
  rows = 5,
}: FormTextAreaProps) {
  return (
    <>
      <textarea
        className="form-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
      />
      {maxLength && (
        <div className="form-hint">
          {value.length} / {maxLength}
        </div>
      )}
    </>
  );
}
