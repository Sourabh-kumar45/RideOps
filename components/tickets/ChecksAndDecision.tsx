"use client";

/**
 * Steps 2 and 3 on the ticket screen.
 *
 * Step 2 – quick checks: the gaps engineering most often sends tickets back
 * for, plus a note for engineering.
 * Step 3 – decision: solve at L1 or escalate. The gate advises but never
 * blocks; escalating against the advice is allowed and recorded as such.
 */
import { ArrowUpRight, CheckCircle2, ChevronDown } from "lucide-react";
import { useState } from "react";
import { api } from "@/client/api";
import { buildHandoffNote } from "@/shared/handoff";
import type { Decision } from "@/shared/domain";
import type { DecisionResponse, GateAssessment, TicketSummary } from "@/shared/types";
import { Button } from "../ui/Button";
import { ErrorNote } from "../ui/Feedback";
import { inputClass } from "../ui/Field";
import { Section } from "../ui/Section";

interface Props {
  ticket: TicketSummary;
  assessment: GateAssessment;
  agent: string;
  onDecided: (result: DecisionResponse) => void;
}

export function ChecksAndDecision({ ticket, assessment, agent, onDecided }: Props) {
  const [checked, setChecked] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState<Decision | null>(null);
  const [error, setError] = useState<string | null>(null);

  const total = assessment.checklist.length;
  const allChecked = checked.length === total;
  const hasNote = notes.trim().length > 0;
  const againstAdvice = assessment.verdict === "checklist_first" && !allChecked;

  const toggle = (item: string) => setChecked((c) => (c.includes(item) ? c.filter((x) => x !== item) : [...c, item]));

  async function decide(decision: Decision) {
    setSaving(decision);
    setError(null);
    try {
      onDecided(await api.decide(ticket.ticketId, { agent, decision, checkedItems: checked, notes }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save. Please try again.");
      setSaving(null);
    }
  }

  return (
    <>
      <Section
        step={2}
        title="Quick checks"
        explain="These are the details engineering most often asks for when it sends a ticket back. Tick what you have done."
        aside={<span className="text-sm text-ink-soft">{checked.length} of {total}</span>}
      >
        <ul className="space-y-2">
          {assessment.checklist.map((item) => {
            const on = checked.includes(item);
            return (
              <li key={item}>
                <label className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${on ? "border-emerald-200 bg-emerald-50" : "border-line hover:bg-page"}`}>
                  <input type="checkbox" checked={on} onChange={() => toggle(item)} className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-600" />
                  <span className="text-ink">{item}</span>
                </label>
              </li>
            );
          })}
        </ul>

        <label htmlFor="eng-note" className="mb-1.5 mt-5 block text-sm font-medium text-ink">
          Note for engineering <span className="font-normal text-ink-soft">(needed to escalate)</span>
        </label>
        <textarea
          id="eng-note"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Booking / trip / employee IDs, when it started, what should happen vs what happens"
          className={inputClass}
        />
      </Section>

      <Section
        step={3}
        title="Your decision"
        explain="Solve it now, or send it to engineering. We save what you chose next to what the gate advised; that feeds the Scorecard."
      >
        {error && <div className="mb-4"><ErrorNote message={error} /></div>}

        <div className="flex flex-wrap gap-2">
          <Button
            variant={assessment.verdict === "escalate_ok" ? "secondary" : "primary"}
            icon={<CheckCircle2 className="h-4 w-4" />}
            disabled={saving !== null}
            onClick={() => decide("resolved_l1")}
          >
            {saving === "resolved_l1" ? "Saving…" : "Solved – close ticket"}
          </Button>
          <Button
            variant={againstAdvice ? "warning" : assessment.verdict === "escalate_ok" ? "primary" : "secondary"}
            icon={<ArrowUpRight className="h-4 w-4" />}
            disabled={saving !== null || !hasNote}
            onClick={() => decide("escalated")}
          >
            {saving === "escalated" ? "Saving…" : againstAdvice ? "Escalate anyway" : "Escalate to engineering"}
          </Button>
        </div>

        <p className="mt-3 text-xs text-ink-soft">
          {!hasNote
            ? "To escalate, first write a note for engineering in step 2."
            : againstAdvice
              ? `${total - checked.length} check(s) still open. You can still escalate; it will be recorded as not following the advice.`
              : "Ready. The note below goes to engineering with the ticket."}
        </p>

        <NotePreview
          note={buildHandoffNote({ ...ticket, checklist: assessment.checklist, checkedItems: checked, notes, agent })}
        />
      </Section>
    </>
  );
}

/** Collapsible preview of exactly what engineering will receive. */
function NotePreview({ note }: { note: string }) {
  return (
    <details className="group mt-4 rounded-xl border border-line">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2.5 text-sm font-medium text-ink">
        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden />
        Preview the note engineering will get
      </summary>
      <pre className="whitespace-pre-wrap border-t border-line px-4 py-3 font-mono text-xs leading-relaxed text-ink">{note}</pre>
    </details>
  );
}
