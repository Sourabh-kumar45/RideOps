"use client";

/**
 * Left column: tickets waiting on L1, most urgent first.
 * "Mine" shows only the current agent's tickets; "Everyone" shows the whole team's.
 */
import { Plus } from "lucide-react";
import { useState } from "react";
import { shortAge } from "@/client/format";
import { priorityTone } from "@/client/labels";
import { FIXED_OUTCOME, STALE_AFTER_HOURS } from "@/shared/domain";
import type { TicketSummary } from "@/shared/types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { ErrorNote, Spinner } from "../ui/Feedback";

interface TicketListProps {
  tickets: TicketSummary[] | null;
  error: string | null;
  onRetry: () => void;
  agent: string;
  selectedId: string | null;
  onSelect: (ticketId: string) => void;
  onNewTicket: () => void;
}

export function TicketList({ tickets, error, onRetry, agent, selectedId, onSelect, onNewTicket }: TicketListProps) {
  const [mineOnly, setMineOnly] = useState(true);
  const all = tickets ?? [];
  const mine = all.filter((t) => t.assignedAgent === agent);
  const visible = mineOnly ? mine : all;

  return (
    <aside className="flex flex-col rounded-2xl border border-line bg-white shadow-card lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)]">
      <div className="border-b border-line p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-ink">Waiting on L1</h2>
          <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={onNewTicket} className="h-9 px-3">
            New ticket
          </Button>
        </div>
        <p className="mt-1 text-sm text-ink-soft">Open tickets you can act on. Most urgent first.</p>

        <div role="group" aria-label="Whose tickets" className="mt-4 grid grid-cols-2 rounded-xl bg-stone-100 p-1 text-sm">
          {[
            { value: true, label: `Mine (${mine.length})` },
            { value: false, label: `Everyone (${all.length})` },
          ].map((o) => (
            <button
              key={o.label}
              type="button"
              aria-pressed={mineOnly === o.value}
              onClick={() => setMineOnly(o.value)}
              className={`rounded-lg py-1.5 font-medium transition-colors ${mineOnly === o.value ? "bg-white text-ink shadow-sm" : "text-ink-soft hover:text-ink"}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {error && <div className="p-2"><ErrorNote message={error} onRetry={onRetry} /></div>}
        {!tickets && !error && <Spinner label="Loading tickets…" />}
        {tickets && visible.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-ink-soft">
            Nothing waiting on you. Switch to <strong>Everyone</strong> to help the team.
          </p>
        )}
        <ul className="space-y-1">
          {visible.map((t) => (
            <li key={t.ticketId}>
              <TicketRow ticket={t} selected={t.ticketId === selectedId} onSelect={onSelect} />
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

/** One ticket in the list. */
function TicketRow({ ticket: t, selected, onSelect }: { ticket: TicketSummary; selected: boolean; onSelect: (id: string) => void }) {
  const stuck = t.ageHours > STALE_AFTER_HOURS;
  return (
    <button
      type="button"
      onClick={() => onSelect(t.ticketId)}
      aria-current={selected ? "true" : undefined}
      className={`w-full rounded-xl px-3 py-3 text-left transition-colors ${selected ? "bg-accent-soft ring-1 ring-accent/30" : "hover:bg-page"}`}
    >
      <div className="flex items-center gap-2 text-xs">
        <Badge tone={priorityTone(t.priority)}>{t.priority}</Badge>
        <span className="font-mono text-ink-mute">{t.ticketId}</span>
        <span className={`ml-auto ${stuck ? "font-semibold text-red-600" : "text-ink-mute"}`}>
          {shortAge(t.ageHours)} old
        </span>
      </div>
      <p className="mt-1.5 line-clamp-2 text-sm font-medium leading-snug text-ink">{t.description}</p>
      <p className="mt-1 truncate text-xs text-ink-soft">{t.clientName}</p>
      {t.engOutcome && (
        <p className={`mt-1 text-xs font-medium ${t.engOutcome === FIXED_OUTCOME ? "text-emerald-700" : "text-amber-700"}`}>
          {t.engOutcome === FIXED_OUTCOME ? "Fixed by engineering – close with client" : "Sent back by engineering"}
        </p>
      )}
    </button>
  );
}
