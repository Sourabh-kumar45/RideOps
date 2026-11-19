/**
 * The Escalation Gate: "what usually happens to tickets like this one?"
 *
 * 1. Find past tickets in the same category with similar wording
 *    (lib/similarity.ts). If there are too few, use the whole category.
 * 2. Count what happened to them: escalated? fixed by engineering? sent back?
 * 3. Turn those counts into a recommendation using the rules in server/config.ts.
 */
import { TICKET_STATUS, type Verdict } from "@/shared/domain";
import type { GateAssessment, History, PastTicket, SuggestResponse } from "@/shared/types";
import {
  AVOIDABLE_OUTCOMES,
  CHECKLISTS,
  DUPLICATE_OUTCOME,
  EXAMPLES_SHOWN,
  FAST_TRACK_PRIORITIES,
  FIXED_OUTCOME,
  FIXED_RATE_TO_ESCALATE,
  KNOWN_ISSUE_HINT_AT,
  MIN_SAMPLE,
  RESOLVE_BELOW_ESCALATION_RATE,
  SIMILARITY_THRESHOLD,
} from "../config";
import type { Ticket } from "../db/schema";
import { buildIndex, issueKey, type SimilarityIndex } from "../lib/similarity";
import { countWhere, median, present } from "../lib/stats";
import { hoursBetween } from "../lib/time";
import { findTicket, loadTickets } from "./tickets";

/* ------------------------- Route entry points ------------------------- */

/** Recommendation for a ticket already in the database. */
export async function getAssessment(ticketId: string): Promise<GateAssessment> {
  const all = await loadTickets();
  return assessTicket(all, findTicket(all, ticketId));
}

/** Best category guess for text typed into the new-ticket form. */
export async function getSuggestion(text: string): Promise<SuggestResponse> {
  const { index, issues } = corpusFor(await loadTickets());
  const best = index.search(text.slice(0, 300))[0];
  if (!best || best.score < SUGGEST_MIN_SCORE) return { category: null, closestIssue: null };
  const issue = issues.get(best.key)!;
  return { category: issue.category, closestIssue: issue.example };
}

/** Below this similarity a suggestion is more likely wrong than right. */
const SUGGEST_MIN_SCORE = 0.25;

/* ------------------------------ Assessment ----------------------------- */

/** Compares one ticket with history and returns the recommendation. */
export function assessTicket(all: Ticket[], subject: Ticket): GateAssessment {
  // 1. Comparison pool.
  const { index, keyOf } = corpusFor(all);
  const scores = new Map(index.search(subject.description).map((m) => [m.key, m.score]));
  const scoreOf = (t: Ticket) => scores.get(keyOf.get(t.description) ?? "") ?? 0;

  const sameCategory = all.filter((t) => t.category === subject.category && t.ticketId !== subject.ticketId);
  const similar = sameCategory.filter((t) => scoreOf(t) >= SIMILARITY_THRESHOLD);
  const pool = similar.length >= MIN_SAMPLE ? similar : sameCategory;

  // 2. What happened to them.
  const history = summarise(pool, similar.length >= MIN_SAMPLE ? "similar" : "category");

  // 3. Recommendation.
  const { verdict, reason } = decide(subject, history);

  return {
    verdict,
    reason,
    hints: buildHints(subject, pool),
    history,
    checklist: CHECKLISTS[subject.category] ?? [],
    examples: pickExamples(pool, scoreOf),
  };
}

/** Counts outcomes for the comparison pool. */
function summarise(pool: Ticket[], basedOn: History["basedOn"]): History {
  const escalated = pool.filter((t) => t.escalated);
  return {
    basedOn,
    tickets: pool.length,
    escalated: escalated.length,
    fixed: countWhere(escalated, (t) => t.engOutcome === FIXED_OUTCOME),
    sentBack: countWhere(escalated, (t) => t.engOutcome !== null && AVOIDABLE_OUTCOMES.includes(t.engOutcome)),
    other: countWhere(escalated, (t) => t.engOutcome === null || (t.engOutcome !== FIXED_OUTCOME && !AVOIDABLE_OUTCOMES.includes(t.engOutcome))),
    medianHoursL1: median(closeHours(pool.filter((t) => !t.escalated))),
    medianHoursEscalated: median(closeHours(escalated)),
  };
}

/** The rules, applied in order; the first match wins. Mirrored in the README. */
function decide(subject: Ticket, h: History): { verdict: Verdict; reason: string } {
  const decided = h.fixed + h.sentBack + h.other;
  const escalationRate = h.tickets ? h.escalated / h.tickets : 0;
  const fixedRate = decided ? h.fixed / decided : 0;

  if (subject.status === TICKET_STATUS.withL1 && subject.engOutcome === FIXED_OUTCOME) {
    return { verdict: "resolve_l1", reason: "Engineering has already fixed this. Confirm with the client and close it." };
  }
  if (FAST_TRACK_PRIORITIES.includes(subject.priority)) {
    return { verdict: "escalate_ok", reason: `This is ${subject.priority} (critical), so it goes straight to engineering. Tick what you could check and send it.` };
  }
  if (h.tickets < MIN_SAMPLE) {
    return { verdict: "resolve_l1", reason: "There is too little history to judge. Try to solve it at L1; escalate only with a full note." };
  }
  if (escalationRate < RESOLVE_BELOW_ESCALATION_RATE) {
    return { verdict: "resolve_l1", reason: `Only ${pct(escalationRate)} of tickets like this ever needed engineering. L1 can usually solve it.` };
  }
  if (decided === 0) {
    return { verdict: "checklist_first", reason: "Similar escalations are still with engineering, so there is no track record yet. Do the checks first." };
  }
  if (fixedRate >= FIXED_RATE_TO_ESCALATE) {
    return { verdict: "escalate_ok", reason: `Engineering fixed ${pct(fixedRate)} of these when they were escalated. Escalate it with a clear note.` };
  }
  return {
    verdict: "checklist_first",
    reason: `${pct(decided ? h.sentBack / decided : 0)} of these came back from engineering unsolved. Do the checks below before escalating.`,
  };
}

/** Warnings the recommendation alone does not carry. */
function buildHints(subject: Ticket, pool: Ticket[]): string[] {
  const hints: string[] = [];
  const withL1 = subject.status === TICKET_STATUS.withL1;

  if (withL1 && subject.engOutcome && AVOIDABLE_OUTCOMES.includes(subject.engOutcome)) {
    hints.push(`Last time, engineering sent this ticket back ("${subject.engOutcome}"). Fix that before escalating again.`);
  }
  const duplicates = countWhere(pool, (t) => t.engOutcome === DUPLICATE_OUTCOME);
  if (duplicates >= KNOWN_ISSUE_HINT_AT) {
    hints.push(`${duplicates} similar tickets turned out to be a known issue. Check the known-issue list first.`);
  }
  return hints;
}

/** The closest closed tickets, newest first among equal matches. */
function pickExamples(pool: Ticket[], scoreOf: (t: Ticket) => number): PastTicket[] {
  return pool
    .filter((t) => t.finalClosedAt !== null)
    .sort((a, b) => scoreOf(b) - scoreOf(a) || b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, EXAMPLES_SHOWN)
    .map((t) => ({
      ticketId: t.ticketId,
      description: t.description,
      escalated: t.escalated,
      engOutcome: t.engOutcome,
      hoursToClose: t.finalClosedAt ? hoursBetween(t.createdAt, t.finalClosedAt) : null,
    }));
}

/** Hours from creation to final close, for closed tickets only. */
function closeHours(list: Ticket[]): number[] {
  return present(list.map((t) => (t.finalClosedAt ? hoursBetween(t.createdAt, t.finalClosedAt) : null)));
}

/** 0.523 → "52%". */
function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

/* ----------------- Similarity corpus (cached per data load) ----------------- */

/** One "issue": descriptions that differ only by numbers ("…for 22 users", "…for 35 users"). */
interface IssueFacts {
  /** Most common original wording. */
  example: string;
  /** Category most of these tickets were filed under. */
  category: string;
}

interface Corpus {
  index: SimilarityIndex;
  issues: Map<string, IssueFacts>;
  /** Issue key for each distinct description. */
  keyOf: Map<string, string>;
}

/** Keyed by the cached ticket array, so it rebuilds automatically after a write. */
const corpusCache = new WeakMap<Ticket[], Corpus>();

function corpusFor(all: Ticket[]): Corpus {
  const cached = corpusCache.get(all);
  if (cached) return cached;

  const keyOf = new Map<string, string>();
  const tally = new Map<string, { wording: Map<string, number>; categories: Map<string, number> }>();
  for (const t of all) {
    if (!keyOf.has(t.description)) keyOf.set(t.description, issueKey(t.description));
    const key = keyOf.get(t.description)!;
    const entry = tally.get(key) ?? { wording: new Map(), categories: new Map() };
    increment(entry.wording, t.description);
    increment(entry.categories, t.category);
    tally.set(key, entry);
  }

  const issues = new Map<string, IssueFacts>();
  for (const [key, entry] of tally) {
    issues.set(key, { example: mostCommon(entry.wording), category: mostCommon(entry.categories) });
  }

  const corpus = { index: buildIndex([...issues.keys()]), issues, keyOf };
  corpusCache.set(all, corpus);
  return corpus;
}

function increment(counts: Map<string, number>, key: string): void {
  counts.set(key, (counts.get(key) ?? 0) + 1);
}

function mostCommon(counts: Map<string, number>): string {
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}
