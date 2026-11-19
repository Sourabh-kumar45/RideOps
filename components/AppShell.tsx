"use client";

/**
 * Top-level frame: header (logo, tabs, data date, "You are" picker) and the
 * two tabs, Tickets and Scorecard.
 *
 * Shared state lives here: the picker options, the current agent (remembered
 * in this browser), and a `version` counter that goes up after every save so
 * the Scorecard reloads.
 */
import { CalendarDays, ClipboardList, Gauge, Route } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { api } from "@/client/api";
import { longDate } from "@/client/format";
import { useRequest } from "@/client/useRequest";
import { ScorecardPage } from "./scorecard/ScorecardPage";
import { TicketsPage } from "./tickets/TicketsPage";
import { ErrorNote, Spinner } from "./ui/Feedback";

type Tab = "tickets" | "scorecard";
const AGENT_KEY = "rideops.agent";

export function AppShell() {
  const catalog = useRequest(api.catalog, []);
  const [tab, setTab] = useState<Tab>("tickets");
  const [agent, setAgent] = useState("");
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  // Once the agent list loads, restore the last agent used in this browser.
  useEffect(() => {
    const agents = catalog.data?.agents;
    if (!agents?.length || agent) return;
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(AGENT_KEY);
    } catch {
      // Storage can be blocked (private mode); fall back to the first agent.
    }
    setAgent(saved && agents.includes(saved) ? saved : agents[0]);
  }, [catalog.data, agent]);

  function chooseAgent(name: string) {
    setAgent(name);
    try {
      window.localStorage.setItem(AGENT_KEY, name);
    } catch {
      // Not critical: the choice just won't be remembered.
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 pt-[env(safe-area-inset-top,0px)] backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-white">
              <Route className="h-5 w-5" aria-hidden />
            </span>
            <span className="hidden font-semibold text-ink sm:block">RideOps Support</span>
          </div>

          <nav className="ml-2 flex gap-1 rounded-xl bg-stone-100 p-1" aria-label="Main">
            <TabButton active={tab === "tickets"} onClick={() => setTab("tickets")} icon={<ClipboardList className="h-4 w-4" />} label="Tickets" />
            <TabButton active={tab === "scorecard"} onClick={() => setTab("scorecard")} icon={<Gauge className="h-4 w-4" />} label="Scorecard" />
          </nav>

          <div className="ml-auto flex items-center gap-3">
            {catalog.data && (
              <span
                className="hidden items-center gap-1.5 rounded-full bg-page px-3 py-1 text-xs text-ink-soft md:inline-flex"
                title="The ticket data ends on 30 Sep 2026, so the app treats 1 Oct 2026 as today and moves forward in real time. Set DEMO_CLOCK=off to use the real date."
              >
                <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                Data date: {longDate(catalog.data.today)}
              </span>
            )}
            {catalog.data && agent && (
              <label className="flex items-center gap-2 text-sm">
                <span className="hidden text-ink-soft sm:inline">You are</span>
                <select
                  value={agent}
                  onChange={(e) => chooseAgent(e.target.value)}
                  className="h-9 rounded-xl border border-line bg-white px-2 text-sm font-medium text-ink focus:border-accent focus:outline-none"
                >
                  {catalog.data.agents.map((a) => <option key={a}>{a}</option>)}
                </select>
              </label>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {catalog.error && <ErrorNote message={catalog.error} onRetry={catalog.reload} />}
        {!catalog.data && !catalog.error && <Spinner label="Loading…" />}
        {catalog.data && agent && (
          <>
            {/* Both tabs stay mounted, so switching back keeps your place. */}
            <div hidden={tab !== "tickets"}>
              <TicketsPage catalog={catalog.data} agent={agent} onDataChanged={bump} />
            </div>
            <div hidden={tab !== "scorecard"}>
              <ScorecardPage version={version} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors ${
        active ? "bg-white text-ink shadow-sm" : "text-ink-soft hover:text-ink"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
