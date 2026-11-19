/**
 * POST /api/tickets/:id/decision → resolve at L1 or escalate, and log it.
 * Body: DecisionRequest. Response: DecisionResponse. Logic: server/services/decisions.ts
 */
import type { DecisionRequest } from "@/shared/types";
import { handle, readJson } from "@/server/lib/http";
import { recordDecision } from "@/server/services/decisions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => recordDecision(params.id, await readJson<DecisionRequest>(req)));
}
