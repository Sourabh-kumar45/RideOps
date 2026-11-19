/**
 * Ticket reads and the "new ticket" write.
 *
 * All reads go through `loadTickets()`, which keeps the ~1.5k rows in memory
 * for TICKET_CACHE_MS. Every write calls `invalidateTickets()`, so the next
 * read (queue, recommendation, scorecard) already includes the change.
 *
 * The cache lives on `globalThis` because Next.js bundles each API route
 * separately; a plain module variable would exist once per route, and a write
 * in one route would not clear the copy another route reads.
 */
import { CHANNELS, PRIORITIES, TICKET_STATUS, type TicketStatus } from "@/shared/domain";
import type { CreateTicketRequest, TicketSummary } from "@/shared/types";
import { TICKET_CACHE_MS } from "../config";
import { db } from "../db/client";
import { tickets, type NewTicket, type Ticket } from "../db/schema";
import { HttpError, requireOneOf, requireText } from "../lib/http";
import { hoursBetween, now } from "../lib/time";

/* ------------------------------- Reads ------------------------------- */

interface TicketCache {
  loadedAt: number;
  rows: Ticket[];
}

const store = globalThis as typeof globalThis & { __rideopsTickets?: TicketCache | null };

/** All tickets, cached briefly. Treat the array as read-only. */
export async function loadTickets(): Promise<Ticket[]> {
  const cache = store.__rideopsTickets;
  if (cache && Date.now() - cache.loadedAt <= TICKET_CACHE_MS) return cache.rows;

  const rows = await db.select().from(tickets);
  store.__rideopsTickets = { loadedAt: Date.now(), rows };
  return rows;
}

/** Forgets the cache so the next read sees the latest writes. */
export function invalidateTickets(): void {
  store.__rideopsTickets = null;
}

/** Finds one ticket or throws 404. */
export function findTicket(all: Ticket[], ticketId: string): Ticket {
  const ticket = all.find((t) => t.ticketId === ticketId);
  if (!ticket) throw new HttpError(404, `Ticket ${ticketId} not found.`);
  return ticket;
}

/** Tickets waiting on L1, most urgent first (priority, then oldest). */
export async function listQueue(): Promise<TicketSummary[]> {
  const asOf = now();
  return (await loadTickets())
    .filter((t) => t.status === TICKET_STATUS.withL1)
    .map((t) => toSummary(t, asOf))
    .sort((a, b) => a.priority.localeCompare(b.priority) || b.ageHours - a.ageHours);
}

/** Converts a database row to the shape the browser uses. */
export function toSummary(ticket: Ticket, asOf: Date = now()): TicketSummary {
  return {
    ticketId: ticket.ticketId,
    createdAt: ticket.createdAt.toISOString(),
    channel: ticket.channel,
    clientName: ticket.clientName,
    clientTier: ticket.clientTier,
    category: ticket.category,
    priority: ticket.priority,
    description: ticket.description,
    assignedAgent: ticket.assignedAgent,
    status: ticket.status as TicketStatus,
    engHandoffs: ticket.engHandoffs,
    engOutcome: ticket.engOutcome,
    ageHours: hoursBetween(ticket.createdAt, asOf),
  };
}

/** Unique values, sorted. */
export function distinct(values: string[]): string[] {
  return [...new Set(values)].sort();
}

/* ------------------------------- Write ------------------------------- */

/**
 * Logs a new ticket raised by a client, assigned to the agent who logged it.
 * Every field is checked against known values so the history stays clean.
 */
export async function createTicket(input: Partial<CreateTicketRequest>): Promise<TicketSummary> {
  const all = await loadTickets();

  const agent = requireOneOf(input.agent, distinct(all.map((t) => t.assignedAgent)), "agent");
  const category = requireOneOf(input.category, distinct(all.map((t) => t.category)), "category");
  const channel = requireOneOf(input.channel, CHANNELS, "channel");
  const priority = requireOneOf(input.priority, PRIORITIES, "priority");
  const description = requireText(input.description, "description");
  if (description.length > 300) throw new HttpError(400, "description must be 300 characters or fewer.");

  const client = all.find((t) => t.clientId === input.clientId);
  if (!client) throw new HttpError(400, "Pick a client from the list.");

  const row: NewTicket = {
    ticketId: nextTicketId(all),
    createdAt: now(),
    channel,
    clientId: client.clientId,
    clientName: client.clientName,
    clientTier: client.clientTier,
    category,
    priority,
    description,
    assignedAgent: agent,
    firstResponseAt: null,
    escalated: false,
    engHandoffs: 0,
    engOutcome: null,
    status: TICKET_STATUS.withL1,
    firstClosedAt: null,
    finalClosedAt: null,
    reopenCount: 0,
    csat: null,
  };

  const [inserted] = await db.insert(tickets).values(row).returning();
  invalidateTickets();
  return toSummary(inserted);
}

/** Next id in the SUP-xxxxx sequence. */
function nextTicketId(all: Ticket[]): string {
  const highest = all.reduce((max, t) => Math.max(max, Number(t.ticketId.slice(4)) || 0), 10000);
  return `SUP-${highest + 1}`;
}
