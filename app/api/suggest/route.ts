/** GET /api/suggest?text=... → best category guess for free text (SuggestResponse). Logic: server/services/gate.ts */
import { handle } from "@/server/lib/http";
import { getSuggestion } from "@/server/services/gate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const text = new URL(req.url).searchParams.get("text") ?? "";
  return handle(() => getSuggestion(text));
}
