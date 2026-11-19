/**
 * Request and response shapes for every API route.
 *
 * Both the routes and the browser import these, so the compiler catches any
 * mismatch. Dates travel as ISO strings because JSON has no Date type.
 */
import type { Channel, Decision, Priority, TicketStatus, Verdict } from "./domain";

/* ---------------------------- Tickets ---------------------------- */

/** A ticket as shown in the list and the ticket screen. */
export interface TicketSummary {
  ticketId: string;
  createdAt: string;
  channel: string;
  clientName: string;
  clientTier: string;
  category: string;
  priority: string;
  description: string;
  assignedAgent: string;
  status: TicketStatus;
  /** Times the ticket has been sent to engineering. */
  engHandoffs: number;
  /** Engineering's last verdict, if it came back from engineering. */
  engOutcome: string | null;
  /** Hours since the client raised it (measured on the app clock). */
  ageHours: number;
}

/** GET /api/tickets → tickets waiting on L1, most urgent first. */
export interface QueueResponse {
  tickets: TicketSummary[];
}

/** POST /api/tickets → body. */
export interface CreateTicketRequest {
  agent: string;
  clientId: string;
  channel: Channel;
  priority: Priority;
  category: string;
  description: string;
}

/** POST /api/tickets → response. */
export interface CreateTicketResponse {
  ticket: TicketSummary;
}

/* ------------------------ Form options --------------------------- */

/** GET /api/catalog → options for the pickers. */
export interface CatalogResponse {
  agents: string[];
  categories: string[];
  clients: { id: string; name: string; tier: string }[];
  ticketCount: number;
  /** The app clock's "today" (see DEMO_CLOCK in server/config.ts). */
  today: string;
}

/** GET /api/suggest?text= → best category guess for free text. */
export interface SuggestResponse {
  category: string | null;
  /** The closest past issue, in its original wording. */
  closestIssue: string | null;
}

/* --------------------------- The gate ---------------------------- */

/** A closed past ticket shown as an example. */
export interface PastTicket {
  ticketId: string;
  description: string;
  escalated: boolean;
  engOutcome: string | null;
  hoursToClose: number | null;
}

/** What happened to similar tickets in the past. */
export interface History {
  /** "similar" = matched by wording; "category" = too few matches, whole category used. */
  basedOn: "similar" | "category";
  tickets: number;
  escalated: number;
  /** Of the escalated: engineering fixed it. */
  fixed: number;
  /** Of the escalated: sent back to L1 (missing info, config, duplicate, how-to). */
  sentBack: number;
  /** Of the escalated: anything else (e.g. not reproducible, still open). */
  other: number;
  medianHoursL1: number | null;
  medianHoursEscalated: number | null;
}

/** GET /api/tickets/:id/assessment */
export interface GateAssessment {
  verdict: Verdict;
  /** One plain sentence explaining the verdict. */
  reason: string;
  /** Extra warnings, e.g. "engineering already sent this back once". */
  hints: string[];
  history: History;
  checklist: string[];
  examples: PastTicket[];
}

/** POST /api/tickets/:id/decision → body. */
export interface DecisionRequest {
  agent: string;
  decision: Decision;
  checkedItems: string[];
  notes: string;
}

/** POST /api/tickets/:id/decision → response. */
export interface DecisionResponse {
  ticketId: string;
  decision: Decision;
  verdict: Verdict;
  followedAdvice: boolean;
}

/* -------------------------- Scorecard ---------------------------- */

/** Escalation numbers for one week (tickets created that week). */
export interface WeekStats {
  /** Monday of the week (IST), YYYY-MM-DD. */
  weekOf: string;
  tickets: number;
  escalationRate: number | null;
  /** Share of escalations engineering fixed. */
  fixedRate: number | null;
}

/** One logged gate decision. */
export interface DecisionLogEntry {
  id: number;
  ticketId: string;
  agent: string;
  verdict: Verdict;
  decision: Decision;
  followedAdvice: boolean;
  createdAt: string;
}

/** GET /api/scorecard */
export interface ScorecardResponse {
  today: string;
  openNow: { total: number; withL1: number; withEngineering: number; olderThan72h: number };
  /** Last complete week and the one before it, for "vs last week". */
  lastWeek: WeekStats | null;
  weekBefore: WeekStats | null;
  /** Open tickets at the end of each week (the number leadership tracks). */
  openByWeek: { weekOf: string; open: number; current: boolean }[];
  decisions: { total: number; resolvedAtL1: number; escalated: number; followedAdvice: number; recent: DecisionLogEntry[] };
}

/** Error body returned by every route on failure. */
export interface ApiErrorBody {
  error: string;
}
