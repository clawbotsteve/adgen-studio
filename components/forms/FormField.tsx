import React from "react";

interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FormField({
  label,
  error,
  hint,
  required,
  children,
}: FormFieldProps) {
  return (
    <div className="form-group">
      <label className="form-label">
        {label}
        {required && <span className="form-label-required">*</span>}
      </label>
      {children}
      {error && <div className="form-error">{error}</div>}
      {hint && <div className="form-hint">{hint}</div>}
    </div>
  );
}
