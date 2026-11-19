/** Small rounded label. The tone sets the colour; the text always carries the meaning. */
import type { ReactNode } from "react";
import type { Tone } from "@/client/labels";

const TONE_CLASSES: Record<Tone, string> = {
  good: "bg-emerald-50 text-emerald-800",
  warn: "bg-amber-50 text-amber-800",
  info: "bg-accent-soft text-accent-strong",
  bad: "bg-red-50 text-red-700",
  neutral: "bg-stone-100 text-stone-700",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]}`}>
      {children}
    </span>
  );
}
