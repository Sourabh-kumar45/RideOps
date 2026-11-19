import type { Ticket } from "../db/schema";
import { AVOIDABLE, MIN_SAMPLE, FIXED_RATE_TO_ESCALATE, KNOWN_ISSUE_HINT_AT, CHECKLISTS } from "../config";

const median = (a: number[]) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const hours = (t: Ticket) => (t.finalClosedAt ? (t.finalClosedAt.getTime() - t.createdAt.getTime()) / 36e5 : null);
const nums = (a: (number | null)[]) => a.filter((x): x is number => x !== null);

/** Looks at past tickets with the same description (or category if too few) and recommends L1 vs escalate. */
export function assess(all: Ticket[], category: string, description: string) {
  const exact = all.filter((t) => t.category === category && t.description === description);
  const basis = exact.length >= MIN_SAMPLE ? "same issue" : "same category";
  const pool = exact.length >= MIN_SAMPLE ? exact : all.filter((t) => t.category === category);
  const esc = pool.filter((t) => t.escalated);
  const outcomes: Record<string, number> = {};
  esc.forEach((t) => { const o = t.engOutcome ?? "Still open"; outcomes[o] = (outcomes[o] ?? 0) + 1; });
  const decided = esc.filter((t) => t.engOutcome);
  const fixedRate = decided.length ? decided.filter((t) => t.engOutcome === "Fixed").length / decided.length : null;
  const avoidableRate = decided.length ? decided.filter((t) => AVOIDABLE.includes(t.engOutcome!)).length / decided.length : null;
  const dupCount = decided.filter((t) => t.engOutcome === "Duplicate of known issue").length;
  let verdict: "resolve_l1" | "checklist_first" | "escalate_ok";
  let reason: string;
  if (pool.length < MIN_SAMPLE || !esc.length) { verdict = "resolve_l1"; reason = "Past tickets like this are rarely escalated. Resolve at L1."; }
  else if ((fixedRate ?? 0) >= FIXED_RATE_TO_ESCALATE) { verdict = "escalate_ok"; reason = "Engineering usually fixes this. Escalate, with a complete handoff note."; }
  else { verdict = "checklist_first"; reason = `${Math.round((avoidableRate ?? 0) * 100)}% of past escalations were sent back or were not bugs. Finish the checklist before escalating.`; }
  return {
    verdict, reason, basis, sample: pool.length, escalationRate: pool.length ? esc.length / pool.length : 0, fixedRate, outcomes,
    knownIssueHint: dupCount >= KNOWN_ISSUE_HINT_AT ? `${dupCount} past escalations were duplicates of a known issue. Check the known-issue list first.` : null,
    medianHoursL1: median(nums(pool.filter((t) => !t.escalated).map(hours))),
    medianHoursEscalated: median(nums(esc.map(hours))),
    checklist: CHECKLISTS[category] ?? [],
  };
}

export interface HandoffInput { category: string; description: string; clientName: string; priority: string; ticketId?: string; checked: string[]; notes: string }
/** Builds the note engineering asked for, so they do not have to bounce the ticket back. */
export function buildHandoff(h: HandoffInput) {
  const done = h.checked.length ? h.checked.map((c) => `- [x] ${c}`).join("\n") : "- None recorded";
  return [`Ticket: ${h.ticketId ?? "(new)"}  |  Priority: ${h.priority}`, `Client: ${h.clientName}`, `Category: ${h.category}`, `Issue: ${h.description}`, "", "L1 checks done:", done, "", `Details (IDs, times, expected vs actual):\n${h.notes || "(missing - add before sending)"}`].join("\n");
}
