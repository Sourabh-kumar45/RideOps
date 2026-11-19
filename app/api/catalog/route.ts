import { NextResponse } from "next/server";
import { loadTickets } from "../../../server/services/tickets";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
/** GET /api/catalog -> { category: [descriptions] } for the form dropdowns. */
export async function GET() {
  const out: Record<string, string[]> = {};
  (await loadTickets()).forEach((t) => { (out[t.category] ??= []); if (!out[t.category].includes(t.description)) out[t.category].push(t.description); });
  return NextResponse.json(out);
}
