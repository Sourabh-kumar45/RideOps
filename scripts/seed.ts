import "dotenv/config";
import fs from "fs";
import { parse } from "csv-parse/sync";
import { db } from "../server/db/client";
import { tickets } from "../server/db/schema";
// CSV times are IST; store as real instants.
const ts = (s?: string) => (s ? new Date(s.replace(" ", "T") + ":00+05:30") : null);
const rows = parse(fs.readFileSync("data/rideops_support_tickets.csv"), { columns: true, skip_empty_lines: true }) as Record<string, string>[];
const vals = rows.map((r) => ({
  ticketId: r.ticket_id, createdAt: ts(r.created_at)!, channel: r.channel, clientId: r.client_id, clientName: r.client_name,
  clientTier: r.client_tier, category: r.category, priority: r.priority, description: r.description, assignedAgent: r.assigned_agent,
  firstResponseAt: ts(r.first_response_at), escalated: r.escalated_to_eng === "Yes", engHandoffs: +r.eng_handoffs,
  engOutcome: r.eng_outcome || null, status: r.status, firstClosedAt: ts(r.first_closed_at), finalClosedAt: ts(r.final_closed_at),
  reopenCount: +r.reopen_count, csat: r.csat_score ? +r.csat_score : null,
}));
(async () => {
  for (let i = 0; i < vals.length; i += 200) await db.insert(tickets).values(vals.slice(i, i + 200)).onConflictDoNothing();
  console.log(`Seeded ${vals.length} tickets`);
})();
