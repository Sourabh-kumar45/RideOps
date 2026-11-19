"use client";

/**
 * The ticket screen: who/what the ticket is, then the three steps
 * (history → checks → decision). Rendered with `key={ticketId}`, so the
 * checklist and note reset when the agent opens another ticket.
 */
import { api } from "@/client/api";
import { dateTime, duration } from "@/client/format";
import { priorityTone } from "@/client/labels";
import { useRequest } from "@/client/useRequest";
import { STALE_AFTER_HOURS } from "@/shared/domain";
import type { DecisionResponse, TicketSummary } from "@/shared/types";
import { Badge } from "../ui/Badge";
import { ErrorNote, Spinner } from "../ui/Feedback";
import { ChecksAndDecision } from "./ChecksAndDecision";
import { Recommendation } from "./Recommendation";

interface TicketViewProps {
  ticket: TicketSummary;
  agent: string;
  onDecided: (result: DecisionResponse) => void;
}

export function TicketView({ ticket: t, agent, onDecided }: TicketViewProps) {
  const assessment = useRequest(() => api.assessment(t.ticketId), [t.ticketId]);
  const stuck = t.ageHours > STALE_AFTER_HOURS;

  return (
    <div className="space-y-4">
      {/* Ticket header */}
      <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-mono text-ink-soft">{t.ticketId}</span>
          <Badge tone={priorityTone(t.priority)}>{t.priority}</Badge>
          <Badge tone={stuck ? "bad" : "neutral"}>Open {duration(t.ageHours)}{stuck ? " · over 3 days" : ""}</Badge>
          {t.engHandoffs > 0 && <Badge tone="warn">Sent to engineering {t.engHandoffs}×</Badge>}
        </div>
        <h1 className="mt-3 text-xl font-semibold leading-snug text-ink sm:text-2xl">{t.description}</h1>
        <p className="mt-2 text-sm text-ink-soft">
          {t.clientName} ({t.clientTier}) · {t.category} · via {t.channel} · raised {dateTime(t.createdAt)} · owner {t.assignedAgent}
        </p>
      </section>

      {assessment.error && <ErrorNote message={assessment.error} onRetry={assessment.reload} />}
      {!assessment.data && !assessment.error && (
        <div className="rounded-2xl border border-line bg-white p-6"><Spinner label="Comparing with past tickets…" /></div>
      )}

      {assessment.data && (
        <>
          <Recommendation assessment={assessment.data} category={t.category} />
          <ChecksAndDecision ticket={t} assessment={assessment.data} agent={agent} onDecided={onDecided} />
        </>
      )}
    </div>
  );
}
