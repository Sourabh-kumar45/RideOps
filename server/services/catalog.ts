/**
 * Options for the pickers (agent, client, category), taken from the data so
 * they never drift from what is in the database.
 */
import type { CatalogResponse } from "@/shared/types";
import { now } from "../lib/time";
import { distinct, loadTickets } from "./tickets";

export async function getCatalog(): Promise<CatalogResponse> {
  const all = await loadTickets();

  // Busiest categories first, so the common ones are at the top of the list.
  const volume = new Map<string, number>();
  for (const t of all) volume.set(t.category, (volume.get(t.category) ?? 0) + 1);

  const clients = new Map<string, CatalogResponse["clients"][number]>();
  for (const t of all) clients.set(t.clientId, { id: t.clientId, name: t.clientName, tier: t.clientTier });

  return {
    agents: distinct(all.map((t) => t.assignedAgent)),
    categories: [...volume.entries()].sort((a, b) => b[1] - a[1]).map(([category]) => category),
    clients: [...clients.values()].sort((a, b) => a.name.localeCompare(b.name)),
    ticketCount: all.length,
    today: now().toISOString(),
  };
}
