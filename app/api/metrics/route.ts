import { NextResponse } from "next/server";
import { loadTickets } from "../../../server/services/tickets";
import { metrics } from "../../../server/services/metrics";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
/** GET /api/metrics -> weekly scorecard + current backlog. Definitions: docs/METRICS.md */
export async function GET() {
  return NextResponse.json(metrics(await loadTickets()));
}
