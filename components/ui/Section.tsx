/**
 * A white card with a title and a one-line plain explanation of what it is
 * for. Every feature on screen uses it, so every feature explains itself.
 * `step` adds a numbered circle for the 1-2-3 flow on the ticket screen.
 */
import type { ReactNode } from "react";

interface SectionProps {
  title: string;
  /** One sentence: what this part does and why it is here. */
  explain?: ReactNode;
  step?: number;
  /** Right-aligned header content. */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Section({ title, explain, step, aside, children, className = "" }: SectionProps) {
  return (
    <section className={`rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6 ${className}`}>
      <header className="mb-4 flex items-start gap-3">
        {step !== undefined && (
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
            {step}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          {explain && <p className="mt-0.5 text-sm text-ink-soft">{explain}</p>}
        </div>
        {aside}
      </header>
      {children}
    </section>
  );
}
