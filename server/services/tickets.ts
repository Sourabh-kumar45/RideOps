import { db } from "../db/client";
import { tickets } from "../db/schema";
import type { Ticket } from "../db/schema";
// All routes read tickets through here. 1,444 rows are cached for 60s per server instance.
// To query Neon differently (filters, joins), change this one file.
let cache: { at: number; rows: Ticket[] } | null = null;
export async function loadTickets(): Promise<Ticket[]> {
  if (!cache || Date.now() - cache.at > 60_000) cache = { at: Date.now(), rows: await db.select().from(tickets) };
  return cache.rows;
}
