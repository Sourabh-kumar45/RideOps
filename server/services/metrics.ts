import type { Ticket } from "../db/schema";
const NOW = new Date("2026-09-30T23:59:00+05:30"); // data pull date
const median = (a: number[]) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const weekStart = (d: Date) => { const x = new Date(d.getTime() + 5.5 * 36e5); x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7)); return x.toISOString().slice(0, 10); };

/** Weekly cohort metrics (by creation week) plus today's backlog. See docs/METRICS.md. */
export function metrics(all: Ticket[]) {
  const weeks = new Map<string, Ticket[]>();
  all.forEach((t) => { const k = weekStart(t.createdAt); weeks.set(k, [...(weeks.get(k) ?? []), t]); });
  const weekly = [...weeks.entries()].sort().map(([week, ts]) => {
    const closed = ts.filter((t) => t.finalClosedAt);
    const esc = ts.filter((t) => t.escalated && t.engOutcome);
    return {
      week, created: ts.length,
      medianHoursToClose: median(closed.map((t) => (t.finalClosedAt!.getTime() - t.createdAt.getTime()) / 36e5)),
      escalationRate: ts.filter((t) => t.escalated).length / ts.length,
      escalationYield: esc.length ? esc.filter((t) => t.engOutcome === "Fixed").length / esc.length : null,
      reopenRate: ts.filter((t) => t.reopenCount > 0).length / ts.length,
    };
  });
  const open = all.filter((t) => !t.finalClosedAt);
  return { weekly, backlog: { open: open.length, openEscalated: open.filter((t) => t.escalated).length, olderThan72h: open.filter((t) => NOW.getTime() - t.createdAt.getTime() > 72 * 36e5).length } };
}
