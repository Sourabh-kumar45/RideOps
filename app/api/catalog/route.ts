/** GET /api/catalog → agents, categories and clients for pickers. Logic: server/services/catalog.ts */
import { handle } from "@/server/lib/http";
import { getCatalog } from "@/server/services/catalog";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return handle(getCatalog);
}
