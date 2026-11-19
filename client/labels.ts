/** Plain-language labels for domain values, in one place so wording stays consistent. */
import type { Decision, Verdict } from "@/shared/domain";

/** Badge colour names, mapped to classes in components/ui/Badge.tsx. */
export type Tone = "good" | "warn" | "info" | "bad" | "neutral";

/** How each recommendation is shown to the agent. */
export const VERDICT_META: Record<Verdict, { title: string; short: string; tone: Tone }> = {
  resolve_l1: { title: "You can likely solve this at L1", short: "Solve at L1", tone: "good" },
  checklist_first: { title: "Do the quick checks before escalating", short: "Check first", tone: "warn" },
  escalate_ok: { title: "Send this to engineering", short: "Escalate", tone: "info" },
};

export const DECISION_LABEL: Record<Decision, string> = {
  resolved_l1: "Solved at L1",
  escalated: "Escalated",
};

/** P1 is critical, P2 high, the rest neutral. */
export function priorityTone(priority: string): Tone {
  if (priority === "P1") return "bad";
  if (priority === "P2") return "warn";
  return "neutral";
}
