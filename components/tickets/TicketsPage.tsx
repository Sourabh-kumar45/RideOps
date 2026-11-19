"use client";

/**
 * The "Tickets" tab: list on the left, the open ticket on the right.
 * After any save (new ticket or decision) it reloads the list and tells the
 * app shell, so the Scorecard tab shows the change too.
 */
import { useCallback, useEffect, useState } from "react";
import { api } from "@/client/api";
import { DECISION_LABEL, VERDICT_META } from "@/client/labels";
import { useRequest } from "@/client/useRequest";
import type { CatalogResponse, DecisionResponse, TicketSummary } from "@/shared/types";
import { Toast, type ToastMessage } from "../ui/Toast";
import { NewTicketDialog } from "./NewTicketDialog";
import { TicketList } from "./TicketList";
import { TicketView } from "./TicketView";
import { Welcome } from "./Welcome";

interface Props {
  catalog: CatalogResponse;
  agent: string;
  onDataChanged: () => void;
}

export function TicketsPage({ catalog, agent, onDataChanged }: Props) {
  const queue = useRequest(api.queue, []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // The ticket just created, shown straight away while the list reloads.
  const [justCreated, setJustCreated] = useState<TicketSummary | null>(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const closeToast = useCallback(() => setToast(null), []);

  // A different agent sees a different list, so start fresh.
  useEffect(() => setSelectedId(null), [agent]);

  const selected: TicketSummary | undefined =
    queue.data?.tickets.find((t) => t.ticketId === selectedId) ??
    (justCreated?.ticketId === selectedId ? justCreated : undefined);

  function afterSave(title: string, detail: string) {
    queue.reload();
    onDataChanged();
    setToast({ id: Date.now(), title, detail });
  }

  function handleCreated(ticket: TicketSummary) {
    setCreating(false);
    setJustCreated(ticket);
    setSelectedId(ticket.ticketId);
    afterSave(`${ticket.ticketId} saved`, "Its recommendation is ready on the right.");
  }

  function handleDecided(result: DecisionResponse) {
    setSelectedId(null);
    const advice = result.followedAdvice
      ? "That matches the advice."
      : `The advice was "${VERDICT_META[result.verdict].short}".`;
    afterSave(`${result.ticketId}: ${DECISION_LABEL[result.decision]}`, `${advice} Saved to the Scorecard.`);
  }

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <TicketList
        tickets={queue.data?.tickets ?? null}
        error={queue.error}
        onRetry={queue.reload}
        agent={agent}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onNewTicket={() => setCreating(true)}
      />

      <div className="min-w-0">
        {selected ? (
          <TicketView key={selected.ticketId} ticket={selected} agent={agent} onDecided={handleDecided} />
        ) : (
          <Welcome agent={agent} ticketCount={catalog.ticketCount} />
        )}
      </div>

      {creating && <NewTicketDialog catalog={catalog} agent={agent} onClose={() => setCreating(false)} onCreated={handleCreated} />}
      <Toast message={toast} onClose={closeToast} />
    </div>
  );
}
