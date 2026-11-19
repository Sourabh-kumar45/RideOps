/**
 * Domain vocabulary shared by the server and the browser.
 *
 * String values must match the text used in data/rideops_support_tickets.csv,
 * because new tickets are compared with historical ones.
 */

/** Ticket priorities, most urgent first. */
export const PRIORITIES = ["P1", "P2", "P3", "P4"] as const;
export type Priority = (typeof PRIORITIES)[number];

/** Channels a client can raise a ticket through. */
export const CHANNELS = ["Email", "Phone", "Client portal", "WhatsApp"] as const;
export type Channel = (typeof CHANNELS)[number];

/** Ticket status values as stored in the `status` column. */
export const TICKET_STATUS = {
  withL1: "Open - with L1",
  withEngineering: "Open - with Engineering",
  closed: "Closed",
} as const;
export type TicketStatus = (typeof TICKET_STATUS)[keyof typeof TICKET_STATUS];

/** The engineering outcome that means engineering really was needed. */
export const FIXED_OUTCOME = "Fixed";

/**
 * What the gate recommends:
 * - `resolve_l1`      history says L1 can handle it
 * - `checklist_first` engineering often sent these back; do the checks first
 * - `escalate_ok`     engineering usually fixes these; escalate with a good note
 */
export type Verdict = "resolve_l1" | "checklist_first" | "escalate_ok";

/** What the agent actually did. */
export type Decision = "resolved_l1" | "escalated";

/** Open tickets older than this many hours count as "stuck" on the scorecard. */
export const STALE_AFTER_HOURS = 72;
