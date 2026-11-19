import { NextResponse } from "next/server";
import { buildHandoff } from "../../../server/services/gate";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
/** POST /api/handoff {category, description, clientName, priority, ticketId?, checked[], notes} -> { note } */
export async function POST(req: Request) {
  return NextResponse.json({ note: buildHandoff(await req.json()) });
}
