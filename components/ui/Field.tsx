/** Form field (label + control + hint) and the shared input style. */
import type { ReactNode } from "react";

/** Classes shared by <input>, <select> and <textarea>. */
export const inputClass =
  "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-mute focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/10";

interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  children: ReactNode;
}

export function Field({ label, htmlFor, hint, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {hint && <div className="mt-1.5 text-xs text-ink-soft">{hint}</div>}
    </div>
  );
}
