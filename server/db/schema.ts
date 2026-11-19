/**
 * Database tables (Drizzle ORM, Postgres on Neon).
 *
 * After changing this file run `npm run db:push` to apply it. drizzle.config.ts
 * limits push to the tables declared here.
 */
import { boolean, integer, pgTable, real, serial, text, timestamp } from "drizzle-orm/pg-core";

/**
 * One row per support ticket. Mirrors data/rideops_support_tickets.csv and
 * grows when agents log new tickets in the app.
 */
export const tickets = pgTable("tickets", {
  ticketId: text("ticket_id").primaryKey(),
  createdAt: timestamp("created_at").notNull(),
  channel: text("channel").notNull(),
  clientId: text("client_id").notNull(),
  clientName: text("client_name").notNull(),
  clientTier: text("client_tier").notNull(),
  category: text("category").notNull(),
  priority: text("priority").notNull(),
  description: text("description").notNull(),
  assignedAgent: text("assigned_agent").notNull(),
  firstResponseAt: timestamp("first_response_at"),
  escalated: boolean("escalated").notNull(),
  engHandoffs: integer("eng_handoffs").notNull(),
  engOutcome: text("eng_outcome"),
  status: text("status").notNull(),
  firstClosedAt: timestamp("first_closed_at"),
  finalClosedAt: timestamp("final_closed_at"),
  reopenCount: integer("reopen_count").notNull(),
  csat: real("csat_score"),
});

/**
 * One row per decision an agent makes through the gate (resolve or escalate).
 * This log is what lets us measure whether the gate is used and followed.
 */
export const gateChecks = pgTable("gate_checks", {
  id: serial("id").primaryKey(),
  ticketId: text("ticket_id").notNull(),
  agent: text("agent").notNull(),
  category: text("category").notNull(),
  priority: text("priority").notNull(),
  /** What the gate recommended at decision time. */
  verdict: text("verdict").notNull(),
  /** What the agent did: "resolved_l1" or "escalated". */
  decision: text("decision").notNull(),
  /** Whether the decision matched the recommendation (rules in services/decisions.ts). */
  followedAdvice: boolean("followed_advice").notNull(),
  checklistTotal: integer("checklist_total").notNull(),
  checkedItems: text("checked_items").array().notNull(),
  notes: text("notes").notNull(),
  /** The note sent to engineering; null when resolved at L1. */
  handoffNote: text("handoff_note"),
  createdAt: timestamp("created_at").notNull(),
});

export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;
export type GateCheck = typeof gateChecks.$inferSelect;
