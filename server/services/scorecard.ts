/**
 * The weekly scorecard: is the fix working?
 *
 * - Open tickets now and how many are stuck (> 72h): the number leadership tracks.
 * - Escalation rate and fixed rate, last complete week vs the week before.
 * - Open tickets at the end of each week, to see the trend.
 * - The gate's own decision log.
 *
 * Weekly rates use tickets *created* that week (IST, Monday start).
 * Definitions: docs/METRICS.md.
 */
import { FIXED_OUTCOME, STALE_AFTER_HOURS, TICKET_STATUS } from "@/shared/domain";
import type { ScorecardResponse, WeekStats } from "@/shared/types";
import type { GateCheck, Ticket } from "../db/schema";
import { countWhere, share } from "../lib/stats";
import { DAY_MS, hoursBetween, istDateLabel, istWeekStart, now } from "../lib/time";
import { loadDecisions, toLogEntry } from "./decisions";
import { loadTickets } from "./tickets";

/** How many recent decisions to list. */
const RECENT_DECISIONS = 10;
const WEEK_MS = 7 * DAY_MS;

/** Loads the data and builds the scorecard. */
export async function getScorecard(): Promise<ScorecardResponse> {
  const [all, decisions] = await Promise.all([loadTickets(), loadDecisions()]);
  return buildScorecard(all, decisions, now());
}

/** Pure builder, separate from loading so it is easy to test. */
export function buildScorecard(all: Ticket[], decisions: GateCheck[], asOf: Date): ScorecardResponse {
  const open = all.filter((t) => t.finalClosedAt === null);
  const thisWeek = istWeekStart(asOf).getTime();

  return {
    today: asOf.toISOString(),
    openNow: {
      total: open.length,
      withL1: countWhere(open, (t) => t.status === TICKET_STATUS.withL1),
      withEngineering: countWhere(open, (t) => t.status === TICKET_STATUS.withEngineering),
      olderThan72h: countWhere(open, (t) => hoursBetween(t.createdAt, asOf) > STALE_AFTER_HOURS),
    },
    lastWeek: weekStats(all, thisWeek - WEEK_MS),
    weekBefore: weekStats(all, thisWeek - 2 * WEEK_MS),
    openByWeek: openByWeek(all, asOf),
    decisions: {
      total: decisions.length,
      resolvedAtL1: countWhere(decisions, (d) => d.decision === "resolved_l1"),
      escalated: countWhere(decisions, (d) => d.decision === "escalated"),
      followedAdvice: countWhere(decisions, (d) => d.followedAdvice),
      recent: decisions.slice(0, RECENT_DECISIONS).map(toLogEntry),
    },
  };
}

/** Escalation numbers for tickets created in the week starting at `start`. */
function weekStats(all: Ticket[], start: number): WeekStats | null {
  const cohort = all.filter((t) => t.createdAt.getTime() >= start && t.createdAt.getTime() < start + WEEK_MS);
  if (cohort.length === 0) return null;
  const escalated = cohort.filter((t) => t.escalated);
  const decided = escalated.filter((t) => t.engOutcome !== null);
  return {
    weekOf: istDateLabel(new Date(start)),
    tickets: cohort.length,
    escalationRate: share(escalated.length, cohort.length),
    fixedRate: share(countWhere(decided, (t) => t.engOutcome === FIXED_OUTCOME), decided.length),
  };
}

/** Open tickets at the end of every week, from the first ticket to now. */
function openByWeek(all: Ticket[], asOf: Date): ScorecardResponse["openByWeek"] {
  if (all.length === 0) return [];
  const first = istWeekStart(new Date(Math.min(...all.map((t) => t.createdAt.getTime())))).getTime();
  const points: ScorecardResponse["openByWeek"] = [];

  for (let start = first; start <= asOf.getTime(); start += WEEK_MS) {
    const end = Math.min(start + WEEK_MS, asOf.getTime()); // the current week ends "now"
    points.push({
      weekOf: istDateLabel(new Date(start)),
      open: countWhere(all, (t) => t.createdAt.getTime() < end && (t.finalClosedAt === null || t.finalClosedAt.getTime() >= end)),
      current: start + WEEK_MS > asOf.getTime(),
    });
  }
  return points;
}
