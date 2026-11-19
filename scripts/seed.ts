/**
 * Loads data/rideops_support_tickets.csv into the `tickets` table.
 *
 * Usage: npm run db:seed
 * Safe to re-run: existing ticket ids are skipped, so tickets logged or
 * updated in the app are never overwritten.
 */
import "dotenv/config";
import fs from "node:fs";
import { parse } from "csv-parse/sync";
import { db } from "../server/db/client";
import { tickets, type NewTicket } from "../server/db/schema";

const CSV_PATH = "data/rideops_support_tickets.csv";
const BATCH_SIZE = 200;

/** CSV times are IST wall-clock ("2026-07-02 01:27"); store them as real instants. */
function istTimestamp(value: string | undefined): Date | null {
  return value ? new Date(`${value.replace(" ", "T")}:00+05:30`) : null;
}

/** Maps one CSV row (column names from data/rideops_data_dictionary.csv) to a table row. */
function toRow(r: Record<string, string>): NewTicket {
  return {
    ticketId: r.ticket_id,
    createdAt: istTimestamp(r.created_at)!,
    channel: r.channel,
    clientId: r.client_id,
    clientName: r.client_name,
    clientTier: r.client_tier,
    category: r.category,
    priority: r.priority,
    description: r.description,
    assignedAgent: r.assigned_agent,
    firstResponseAt: istTimestamp(r.first_response_at),
    escalated: r.escalated_to_eng === "Yes",
    engHandoffs: Number(r.eng_handoffs),
    engOutcome: r.eng_outcome || null,
    status: r.status,
    firstClosedAt: istTimestamp(r.first_closed_at),
    finalClosedAt: istTimestamp(r.final_closed_at),
    reopenCount: Number(r.reopen_count),
    csat: r.csat_score ? Number(r.csat_score) : null,
  };
}

async function main() {
  const records = parse(fs.readFileSync(CSV_PATH), { columns: true, skip_empty_lines: true }) as Record<string, string>[];
  const rows = records.map(toRow);

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    await db.insert(tickets).values(rows.slice(i, i + BATCH_SIZE)).onConflictDoNothing();
  }
  console.log(`Seeded ${rows.length} tickets from ${CSV_PATH} (existing ids skipped).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
