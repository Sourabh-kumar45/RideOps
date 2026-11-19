/**
 * Step 1 on the ticket screen: what happened to similar tickets before, and
 * what the gate recommends because of it.
 */
import { AlertTriangle, ArrowUpRight, CheckCircle2, ClipboardList } from "lucide-react";
import type { ReactNode } from "react";
import { duration } from "@/client/format";
import { VERDICT_META } from "@/client/labels";
import { FIXED_OUTCOME, type Verdict } from "@/shared/domain";
import type { GateAssessment, PastTicket } from "@/shared/types";
import { Section } from "../ui/Section";

const BANNER: Record<Verdict, { box: string; text: string; icon: ReactNode }> = {
  resolve_l1: { box: "bg-emerald-50", text: "text-emerald-900", icon: <CheckCircle2 className="h-6 w-6 text-emerald-600" aria-hidden /> },
  checklist_first: { box: "bg-amber-50", text: "text-amber-900", icon: <ClipboardList className="h-6 w-6 text-amber-600" aria-hidden /> },
  escalate_ok: { box: "bg-accent-soft", text: "text-accent-strong", icon: <ArrowUpRight className="h-6 w-6 text-accent" aria-hidden /> },
};

export function Recommendation({ assessment: a, category }: { assessment: GateAssessment; category: string }) {
  const banner = BANNER[a.verdict];
  const h = a.history;

  return (
    <Section
      step={1}
      title="What happened to tickets like this before"
      explain="We looked for past tickets with similar wording and checked how they ended. That history drives the advice."
    >
      {/* The advice */}
      <div className={`flex items-start gap-3 rounded-xl p-4 ${banner.box}`} role="status">
        {banner.icon}
        <div>
          <p className={`text-lg font-semibold ${banner.text}`}>{VERDICT_META[a.verdict].title}</p>
          <p className="mt-0.5 text-sm text-ink">{a.reason}</p>
        </div>
      </div>

      {a.hints.map((hint) => (
        <p key={hint} className="mt-2 flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {hint}
        </p>
      ))}

      {/* The numbers behind it */}
      <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Fact value={h.tickets} label={h.basedOn === "similar" ? "similar past tickets" : `past "${category}" tickets`} />
        <Fact value={h.escalated} label="were sent to engineering" />
        <Fact value={h.fixed} label="engineering fixed" />
        <Fact value={h.sentBack} label="came back to L1 unsolved" />
      </dl>
      <p className="mt-3 text-sm text-ink-soft">
        Usually closed in <strong className="text-ink">{duration(h.medianHoursL1)}</strong> when solved at L1, and{" "}
        <strong className="text-ink">{duration(h.medianHoursEscalated)}</strong> when escalated.
        {h.basedOn === "category" && " Few tickets had this exact wording, so we used the whole category."}
      </p>

      {/* A few real examples, so the agent can sanity-check the match */}
      {a.examples.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-mute">Closest past tickets</p>
          <ul className="mt-2 divide-y divide-line">
            {a.examples.map((t) => <Example key={t.ticketId} ticket={t} />)}
          </ul>
        </div>
      )}
    </Section>
  );
}

function Fact({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl bg-page px-3 py-2.5">
      <dd className="text-xl font-semibold text-ink">{value}</dd>
      <dt className="text-xs leading-snug text-ink-soft">{label}</dt>
    </div>
  );
}

/** One past ticket and how it ended. */
function Example({ ticket: t }: { ticket: PastTicket }) {
  const ending = !t.escalated
    ? "Solved at L1"
    : t.engOutcome === FIXED_OUTCOME
      ? "Escalated, fixed by engineering"
      : `Escalated, came back: ${t.engOutcome ?? "still open"}`;
  return (
    <li className="py-2.5">
      <p className="text-sm text-ink">{t.description}</p>
      <p className="mt-0.5 text-xs text-ink-soft">
        <span className="font-mono">{t.ticketId}</span> · {ending} · closed in {duration(t.hoursToClose)}
      </p>
    </li>
  );
}
