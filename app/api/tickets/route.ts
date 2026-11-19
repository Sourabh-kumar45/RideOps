/**
 * GET  /api/tickets → tickets waiting on L1 (QueueResponse).
 * POST /api/tickets → log a new ticket (CreateTicketRequest → CreateTicketResponse).
 * Logic: server/services/tickets.ts
 */
import type { CreateTicketRequest, CreateTicketResponse, QueueResponse } from "@/shared/types";
import { handle, readJson } from "@/server/lib/http";
import { createTicket, listQueue } from "@/server/services/tickets";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return handle<QueueResponse>(async () => ({ tickets: await listQueue() }));
}

export async function POST(req: Request) {
  return handle<CreateTicketResponse>(async () => {
    const body = await readJson<CreateTicketRequest>(req);
    return { ticket: await createTicket(body) };
  }, 201);
}
