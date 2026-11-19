/**
 * Handoff note sent to engineering when a ticket is escalated.
 *
 * This is a pure function, so the browser uses it for the live preview and the
 * server uses it to store the final note: both always produce the same text.
 * Engineering asked for exactly this: what was checked and the concrete details,
 * so they do not have to bounce the ticket back to L1.
 */

export interface HandoffInput {
  ticketId: string;
  priority: string;
  clientName: string;
  category: string;
  description: string;
  /** Every checklist item for the category. */
  checklist: string[];
  /** The items the agent ticked. */
  checkedItems: string[];
  /** Free text: IDs, times, expected vs actual. */
  notes: string;
  agent: string;
}

/** Placeholder shown while the details field is empty. */
const MISSING_DETAILS = "(missing - add before sending)";

/** Builds the plain-text handoff note. */
export function buildHandoffNote(input: HandoffInput): string {
  const checks = input.checklist.length
    ? input.checklist.map((item) => `- [${input.checkedItems.includes(item) ? "x" : " "}] ${item}`)
    : ["- No checklist for this category"];

  return [
    `Ticket: ${input.ticketId}  |  Priority: ${input.priority}`,
    `Client: ${input.clientName}`,
    `Category: ${input.category}`,
    `Issue: ${input.description}`,
    `Escalated by: ${input.agent}`,
    "",
    "L1 checks:",
    ...checks,
    "",
    "Details (IDs, times, expected vs actual):",
    input.notes.trim() || MISSING_DETAILS,
  ].join("\n");
}
