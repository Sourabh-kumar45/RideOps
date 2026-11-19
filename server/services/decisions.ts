/**
 * Write-back: an agent resolves or escalates a ticket through the gate.
 *
 * One request does two writes in a single atomic batch:
 *   1. updates the ticket row (closed, or sent to engineering);
 *   2. adds a row to `gate_checks` recording what the gate advised and what
 *      the agent did. The scorecard reads this log.
 * The recommendation is recomputed on the server, so the log never trusts the browser.
 */
import { desc, eq } from "drizzle-orm";
import { TICKET_STATUS, type Decision, type Verdict } from "@/shared/domain";
import { buildHandoffNote } from "@/shared/handoff";
import type { DecisionLogEntry, DecisionRequest, DecisionResponse } from "@/shared/types";
import { db } from "../db/client";
import { gateChecks, tickets, type GateCheck, type Ticket } from "../db/schema";
import { HttpError, requireOneOf } from "../lib/http";
import { now } from "../lib/time";
import { assessTicket } from "./gate";
import { distinct, findTicket, invalidateTickets, loadTickets } from "./tickets";

const DECISIONS: readonly Decision[] = ["resolved_l1", "escalated"];
const MAX_NOTES_LENGTH = 2000;

/**
 * Did the agent do what the gate recommended?
 * - resolve_l1      → yes if they resolved it.
 * - escalate_ok     → yes if they escalated it.
 * - checklist_first → yes if they resolved it, or escalated with every check ticked.
 */
export function followedAdvice(verdict: Verdict, decision: Decision, checklistComplete: boolean): boolean {
  if (verdict === "resolve_l1") return decision === "resolved_l1";
  if (verdict === "escalate_ok") return decision === "escalated";
  return decision === "resolved_l1" || checklistComplete;
}

/** Applies an agent's decision to a ticket that is waiting on L1. */
export async function recordDecision(ticketId: string, input: Partial<DecisionRequest>): Promise<DecisionResponse> {
  const all = await loadTickets();
  const ticket = findTicket(all, ticketId);
  if (ticket.status !== TICKET_STATUS.withL1) {
    throw new HttpError(409, `${ticketId} is not waiting on L1 any more (status: ${ticket.status}).`);
  }

  // Validate input.
  const agent = requireOneOf(input.agent, distinct(all.map((t) => t.assignedAgent)), "agent");
  const decision = requireOneOf(input.decision, DECISIONS, "decision");
  const notes = typeof input.notes === "string" ? input.notes.trim() : "";
  if (notes.length > MAX_NOTES_LENGTH) throw new HttpError(400, `Notes must be ${MAX_NOTES_LENGTH} characters or fewer.`);
  if (decision === "escalated" && !notes) {
    throw new HttpError(400, "Write a note for engineering (IDs, times, expected vs actual) before escalating.");
  }

  // Recompute the recommendation; keep only ticked items that are on the real checklist.
  const assessment = assessTicket(all, ticket);
  const checkedItems = (Array.isArray(input.checkedItems) ? input.checkedItems : []).filter(
    (item): item is string => typeof item === "string" && assessment.checklist.includes(item),
  );
  const followed = followedAdvice(assessment.verdict, decision, checkedItems.length === assessment.checklist.length);
  const at = now();

  await db.batch([
    db.update(tickets).set(ticketChanges(ticket, decision, at)).where(eq(tickets.ticketId, ticket.ticketId)),
    db.insert(gateChecks).values({
      ticketId: ticket.ticketId,
      agent,
      category: ticket.category,
      priority: ticket.priority,
      verdict: assessment.verdict,
      decision,
      followedAdvice: followed,
      checklistTotal: assessment.checklist.length,
      checkedItems,
      notes,
      handoffNote:
        decision === "escalated"
          ? buildHandoffNote({ ...ticket, checklist: assessment.checklist, checkedItems, notes, agent })
          : null,
      createdAt: at,
    }),
  ]);
  invalidateTickets();

  return { ticketId: ticket.ticketId, decision, verdict: assessment.verdict, followedAdvice: followed };
}

/** Column changes for each decision. */
function ticketChanges(ticket: Ticket, decision: Decision, at: Date): Partial<Ticket> {
  const firstResponseAt = ticket.firstResponseAt ?? at;
  if (decision === "resolved_l1") {
    return { status: TICKET_STATUS.closed, firstResponseAt, firstClosedAt: ticket.firstClosedAt ?? at, finalClosedAt: at };
  }
  return {
    status: TICKET_STATUS.withEngineering,
    firstResponseAt,
    escalated: true,
    engHandoffs: ticket.engHandoffs + 1,
    engOutcome: null, // waiting for engineering's new verdict
  };
}

/* ------------------------------ Log reads ------------------------------ */

/** Every logged decision, newest first. The log is small, so no cache. */
export async function loadDecisions(): Promise<GateCheck[]> {
  return db.select().from(gateChecks).orderBy(desc(gateChecks.createdAt));
}

/** Converts a log row to what the scorecard shows. */
export function toLogEntry(row: GateCheck): DecisionLogEntry {
  return {
    id: row.id,
    ticketId: row.ticketId,
    agent: row.agent,
    verdict: row.verdict as Verdict,
    decision: row.decision as Decision,
    followedAdvice: row.followedAdvice,
    createdAt: row.createdAt.toISOString(),
  };
}
