/** GET /api/scorecard → weekly numbers and the decision log (ScorecardResponse). Logic: server/services/scorecard.ts */
import { handle } from "@/server/lib/http";
import { getScorecard } from "@/server/services/scorecard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return handle(getScorecard);
}
