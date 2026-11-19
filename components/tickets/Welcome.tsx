/**
 * Shown when no ticket is open: a short, friendly explanation of what this
 * tool does and why, so a new agent understands it in ten seconds.
 */
import { ArrowUpRight, ClipboardCheck, History } from "lucide-react";
import { firstName } from "@/client/format";

export function Welcome({ agent, ticketCount }: { agent: string; ticketCount: number }) {
  const steps = [
    {
      icon: <History className="h-5 w-5" aria-hidden />,
      title: "See what happened before",
      body: `We compare the ticket with ${ticketCount.toLocaleString()} past tickets and tell you whether tickets like it needed engineering.`,
    },
    {
      icon: <ClipboardCheck className="h-5 w-5" aria-hidden />,
      title: "Do a few quick checks",
      body: "A short checklist covers what engineering usually asks for: IDs, settings, known issues.",
    },
    {
      icon: <ArrowUpRight className="h-5 w-5" aria-hidden />,
      title: "Solve it or escalate it",
      body: "Close it yourself, or send it to engineering with a complete note. Your choice is saved.",
    },
  ];

  return (
    <section className="rounded-2xl border border-line bg-white p-8 shadow-card">
      <p className="text-sm font-medium text-accent">Hi {firstName(agent)} 👋</p>
      <h1 className="mt-2 text-2xl font-semibold text-ink">Pick a ticket on the left to get started.</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Half of the tickets sent to engineering came back unsolved, usually because of missing details or a known issue,
        and every round trip added about two days. This tool helps you send engineering only what it can fix.
      </p>
      <ol className="mt-6 grid gap-3 md:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.title} className="rounded-xl bg-page p-4">
            <div className="flex items-center gap-2 text-accent">
              {s.icon}
              <span className="text-xs font-semibold uppercase tracking-wide">Step {i + 1}</span>
            </div>
            <p className="mt-2 font-semibold text-ink">{s.title}</p>
            <p className="mt-1 text-sm text-ink-soft">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
