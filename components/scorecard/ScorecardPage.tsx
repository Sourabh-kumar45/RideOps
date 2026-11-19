"use client";

/**
 * The "Scorecard" tab: is the fix working?
 *
 * 1. Four headline numbers (open now, stuck > 3 days, escalation rate, share fixed).
 * 2. One chart: open tickets at the end of each week.
 * 3. The gate's decision log: proof the tool is used, and how often its advice is followed.
 *
 * Reloads whenever `version` changes, i.e. after any save on the Tickets tab.
 */
import { ArrowDownRight, ArrowUpRight, Check, X } from "lucide-react";
import { api } from "@/client/api";
import { dateTime, dayMonth, pct } from "@/client/format";
import { DECISION_LABEL, VERDICT_META } from "@/client/labels";
import { useRequest } from "@/client/useRequest";
import type { ScorecardResponse, WeekStats } from "@/shared/types";
import { Badge } from "../ui/Badge";
import { ErrorNote, Spinner } from "../ui/Feedback";
import { Section } from "../ui/Section";

export function ScorecardPage({ version }: { version: number }) {
  const { data, error, loading, reload } = useRequest(api.scorecard, [version]);

  if (error && !data) return <ErrorNote message={error} onRetry={reload} />;
  if (!data) return <Spinner label="Loading the scorecard…" />;

  return (
    <div className={`mx-auto max-w-5xl space-y-5 transition-opacity ${loading ? "opacity-60" : ""}`}>
      <header>
        <h1 className="text-2xl font-semibold text-ink">Scorecard</h1>
        <p className="mt-1 text-ink-soft">
          Are we bringing the open-ticket number down? These numbers update every time someone saves a decision.
        </p>
      </header>

      <Headlines data={data} />
      <OpenTrend points={data.openByWeek} />
      <DecisionLog decisions={data.decisions} />
    </div>
  );
}

/* --------------------------- Headline numbers --------------------------- */

function Headlines({ data }: { data: ScorecardResponse }) {
  const { openNow, lastWeek, weekBefore } = data;
  const weekNote = lastWeek ? `Tickets raised in the week of ${dayMonth(lastWeek.weekOf)}.` : "";

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Stat
        label="Open tickets right now"
        value={String(openNow.total)}
        meaning={`${openNow.withL1} waiting on L1, ${openNow.withEngineering} with engineering.`}
      />
      <Stat
        label="Stuck for over 3 days"
        value={String(openNow.olderThan72h)}
        meaning="Our main goal: get this number down week after week."
      />
      <Stat
        label="Sent to engineering"
        value={pct(lastWeek?.escalationRate)}
        meaning={`${weekNote} Lower is better.`}
        change={<Change now={lastWeek} before={weekBefore} pick="escalationRate" better="lower" />}
      />
      <Stat
        label="Escalations engineering fixed"
        value={pct(lastWeek?.fixedRate)}
        meaning={`${weekNote} Higher means we escalate the right tickets.`}
        change={<Change now={lastWeek} before={weekBefore} pick="fixedRate" better="higher" />}
      />
    </div>
  );
}

function Stat({ label, value, meaning, change }: { label: string; value: string; meaning: string; change?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-ink">{value}</p>
      {change}
      <p className="mt-2 text-xs leading-relaxed text-ink-soft">{meaning}</p>
    </div>
  );
}

/** "↓ 3 pts vs week before" in green if it improved, red if it got worse. */
function Change({ now, before, pick, better }: { now: WeekStats | null; before: WeekStats | null; pick: "escalationRate" | "fixedRate"; better: "lower" | "higher" }) {
  const a = now?.[pick];
  const b = before?.[pick];
  if (a == null || b == null) return null;
  const points = Math.round((a - b) * 100);
  if (points === 0) return <p className="mt-1 text-xs text-ink-soft">Same as the week before</p>;
  const improved = better === "lower" ? points < 0 : points > 0;
  const Arrow = points > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${improved ? "text-emerald-700" : "text-red-600"}`}>
      <Arrow className="h-3.5 w-3.5" aria-hidden />
      {Math.abs(points)} pts vs the week before ({improved ? "better" : "worse"})
    </p>
  );
}

/* ------------------------------ Weekly trend ----------------------------- */

/** Simple bar chart drawn with plain HTML: every bar carries its own number. */
function OpenTrend({ points }: { points: ScorecardResponse["openByWeek"] }) {
  const max = Math.max(1, ...points.map((p) => p.open));
  const first = points.find((p) => !p.current && p.open > 0);
  const last = [...points].reverse().find((p) => !p.current);

  return (
    <Section
      title="Open tickets at the end of each week"
      explain={
        first && last
          ? `This is the number leadership watches. It went from ${first.open} to ${last.open} since July. The goal is shorter bars.`
          : "This is the number leadership watches. The goal is shorter bars."
      }
    >
      <div className="overflow-x-auto">
        <ol className="flex h-56 min-w-[36rem] items-end gap-2" aria-label="Open tickets by week">
          {points.map((p) => (
            <li key={p.weekOf} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <span className="text-xs font-medium text-ink">{p.open}</span>
              <div
                className={`w-full max-w-10 rounded-t-md ${p.current ? "bg-accent/35" : "bg-accent"}`}
                style={{ height: `${(p.open / max) * 75}%` }}
                title={`Week of ${dayMonth(p.weekOf)}: ${p.open} open${p.current ? " (so far)" : ""}`}
              />
              <span className="whitespace-nowrap text-[11px] text-ink-mute">{dayMonth(p.weekOf)}</span>
            </li>
          ))}
        </ol>
      </div>
      <p className="mt-3 text-xs text-ink-mute">The lighter bar is the current week, which is not over yet.</p>
    </Section>
  );
}

/* ------------------------------ Decision log ----------------------------- */

function DecisionLog({ decisions: d }: { decisions: ScorecardResponse["decisions"] }) {
  return (
    <Section
      title="Decisions made with the gate"
      explain="Every “Solved” or “Escalate” saved on the Tickets tab shows up here, next to what the gate advised. It shows whether the tool is used and trusted."
    >
      {d.total === 0 ? (
        <p className="rounded-xl bg-page px-4 py-6 text-center text-sm text-ink-soft">
          No decisions yet. Open a ticket on the Tickets tab and solve or escalate it. It will appear here.
        </p>
      ) : (
        <>
          <p className="text-sm text-ink">
            <strong>{d.total}</strong> {d.total === 1 ? "decision" : "decisions"} so far: <strong>{d.resolvedAtL1}</strong> solved at L1,{" "}
            <strong>{d.escalated}</strong> escalated. The advice was followed <strong>{d.followedAdvice}</strong> of {d.total} times.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-ink-soft">
                  <th className="py-2 pr-3 font-medium">When</th>
                  <th className="py-2 pr-3 font-medium">Ticket</th>
                  <th className="py-2 pr-3 font-medium">Agent</th>
                  <th className="py-2 pr-3 font-medium">Gate advised</th>
                  <th className="py-2 pr-3 font-medium">Agent did</th>
                  <th className="py-2 font-medium">Followed?</th>
                </tr>
              </thead>
              <tbody>
                {d.recent.map((r) => (
                  <tr key={r.id} className="border-b border-line/70 last:border-0">
                    <td className="py-2.5 pr-3 text-ink-soft">{dateTime(r.createdAt)}</td>
                    <td className="py-2.5 pr-3 font-mono text-xs">{r.ticketId}</td>
                    <td className="py-2.5 pr-3">{r.agent}</td>
                    <td className="py-2.5 pr-3"><Badge tone={VERDICT_META[r.verdict].tone}>{VERDICT_META[r.verdict].short}</Badge></td>
                    <td className="py-2.5 pr-3">{DECISION_LABEL[r.decision]}</td>
                    <td className="py-2.5">
                      {r.followedAdvice ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700"><Check className="h-4 w-4" aria-hidden />Yes</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600"><X className="h-4 w-4" aria-hidden />No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Section>
  );
}
