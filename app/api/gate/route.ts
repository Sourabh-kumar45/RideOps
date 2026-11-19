import { NextResponse } from "next/server";
import { loadTickets } from "../../../server/services/tickets";
import { assess } from "../../../server/services/gate";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
/** POST /api/gate {category, description} -> verdict, history, checklist. Logic: server/services/gate.ts */
export async function POST(req: Request) {
  const { category, description } = await req.json().catch(() => ({}));
  if (!category || !description) return NextResponse.json({ error: "category and description are required" }, { status: 400 });
  return NextResponse.json(assess(await loadTickets(), category, description));
}
