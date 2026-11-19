"use client";

/**
 * Log a ticket a client just raised. While the agent types the problem,
 * /api/suggest guesses the category from similar past tickets and fills it in
 * (the agent can change it). On save, the ticket opens with its recommendation.
 */
import { Sparkles } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { api } from "@/client/api";
import { CHANNELS, PRIORITIES, type Channel, type Priority } from "@/shared/domain";
import type { CatalogResponse, SuggestResponse, TicketSummary } from "@/shared/types";
import { Button } from "../ui/Button";
import { ErrorNote } from "../ui/Feedback";
import { Field, inputClass } from "../ui/Field";
import { Modal } from "../ui/Modal";

/** Wait this long after the last keystroke before asking for a suggestion. */
const SUGGEST_DELAY_MS = 350;

interface Props {
  catalog: CatalogResponse;
  agent: string;
  onClose: () => void;
  onCreated: (ticket: TicketSummary) => void;
}

export function NewTicketDialog({ catalog, agent, onClose, onCreated }: Props) {
  const [clientName, setClientName] = useState("");
  const [channel, setChannel] = useState<Channel>("Email");
  const [priority, setPriority] = useState<Priority>("P3");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [pickedByHand, setPickedByHand] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const client = useMemo(
    () => catalog.clients.find((c) => c.name.toLowerCase() === clientName.trim().toLowerCase()),
    [catalog.clients, clientName],
  );

  // Suggest a category a moment after typing stops; cancel if the text changes again.
  useEffect(() => {
    const text = description.trim();
    if (text.length < 4) return setSuggestion(null);
    const controller = new AbortController();
    const timer = setTimeout(() => {
      api
        .suggest(text, controller.signal)
        .then((s) => {
          setSuggestion(s);
          if (!pickedByHand && s.category) setCategory(s.category);
        })
        .catch(() => undefined); // a suggestion is a nice-to-have; ignore failures
    }, SUGGEST_DELAY_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [description, pickedByHand]);

  const ready = !!client && description.trim().length >= 4 && !!category && !saving;

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!client) return setError("Pick a client from the list.");
    setSaving(true);
    setError(null);
    try {
      const { ticket } = await api.createTicket({ agent, clientId: client.id, channel, priority, category, description });
      onCreated(ticket);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the ticket.");
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Log a new ticket"
      explain="Write the problem the way the client described it. We'll check it against past tickets as soon as you save."
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="new-ticket" disabled={!ready}>
            {saving ? "Saving…" : "Save and check"}
          </Button>
        </>
      }
    >
      <form id="new-ticket" onSubmit={save} className="space-y-4">
        <Field
          label="Client"
          htmlFor="nt-client"
          hint={clientName && !client ? <span className="text-red-600">Choose a client from the list.</span> : undefined}
        >
          <input
            id="nt-client"
            list="nt-clients"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Start typing a company name"
            autoComplete="off"
            className={inputClass}
          />
          <datalist id="nt-clients">
            {catalog.clients.map((c) => <option key={c.id} value={c.name} />)}
          </datalist>
        </Field>

        <Field label="What is the problem?" htmlFor="nt-description">
          <textarea
            id="nt-description"
            rows={2}
            maxLength={300}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Roster still uses the old cutoff after we changed it"
            className={inputClass}
          />
        </Field>

        <Field
          label="Category"
          htmlFor="nt-category"
          hint={
            suggestion?.closestIssue ? (
              <span className="flex items-start gap-1.5">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
                Suggested because it looks like a past issue: “{suggestion.closestIssue}”
              </span>
            ) : (
              "We'll suggest one once you describe the problem."
            )
          }
        >
          <select
            id="nt-category"
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPickedByHand(true); }}
            className={inputClass}
          >
            <option value="">Select a category</option>
            {catalog.categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Priority" htmlFor="nt-priority" hint="P1 = critical">
            <select id="nt-priority" value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className={inputClass}>
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Came in by" htmlFor="nt-channel">
            <select id="nt-channel" value={channel} onChange={(e) => setChannel(e.target.value as Channel)} className={inputClass}>
              {CHANNELS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>

        {error && <ErrorNote message={error} />}
      </form>
    </Modal>
  );
}
