import { pgTable, text, timestamp, integer, boolean, real } from "drizzle-orm/pg-core";
/** One row per support ticket (mirrors rideops_support_tickets.csv). */
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
export type Ticket = typeof tickets.$inferSelect;
