"use client";

import { useId } from "react";

/** Campo de formulário padrão do site (input ou textarea). */
export default function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  hint,
  required,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  multiline?: boolean;
}) {
  const id = useId();

  const className =
    "w-full rounded-xl border border-white/10 bg-white/4 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-muted focus:border-cyan-400/60 focus:bg-white/6";

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-xs font-medium uppercase tracking-wider text-silver-400"
      >
        {label}
        {required && <span className="ml-1 text-cyan-400">*</span>}
      </label>

      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          rows={4}
          className={`${className} resize-y`}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={className}
        />
      )}

      {hint && <p className="mt-1.5 text-[11px] text-muted">{hint}</p>}
    </div>
  );
}
