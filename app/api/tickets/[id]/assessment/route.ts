/** GET /api/tickets/:id/assessment → gate verdict with evidence (GateAssessment). Logic: server/services/gate.ts */
import { handle } from "@/server/lib/http";
import { getAssessment } from "@/server/services/gate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return handle(() => getAssessment(params.id));
}
