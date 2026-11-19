/**
 * Gate rules and app settings — EDIT HERE to change policy.
 *
 * Every threshold the app uses lives in this file; services import from here
 * and never hard-code numbers. The README's "How to change things" table points
 * here, and docs/DIAGNOSIS.md explains where each value comes from.
 */

/* ------------------------------------------------------------------ */
/* Engineering outcomes                                                */
/* ------------------------------------------------------------------ */

/** The outcome that means engineering really was needed (shared with the browser). */
export { FIXED_OUTCOME } from "@/shared/domain";

/** The outcome that means the issue was already known. Drives the known-issue hint. */
export const DUPLICATE_OUTCOME = "Duplicate of known issue";

/**
 * Outcomes where engineering was not really needed: 253 of 486 escalations (52%).
 * Text must match `eng_outcome` in the CSV exactly.
 */
export const AVOIDABLE_OUTCOMES: readonly string[] = [
  "Insufficient info - returned to L1",
  "Config issue - returned to L1",
  DUPLICATE_OUTCOME,
  "Not a bug - how-to",
];

/* ------------------------------------------------------------------ */
/* Verdict thresholds                                                  */
/* ------------------------------------------------------------------ */

/** Fewer similar past tickets than this: compare against the whole category instead. */
export const MIN_SAMPLE = 5;

/**
 * Minimum text similarity (0..1, TF-IDF cosine) for a past description to count
 * as "the same issue". Numbers are ignored, so "SSO failing for 22 users" and
 * "SSO failing for 35 users" score 1.0; a paraphrase such as "report download
 * keeps loading" vs "Monthly trip report download stuck at loading" scores ~0.56.
 * Matching is always restricted to the ticket's own category.
 */
export const SIMILARITY_THRESHOLD = 0.35;

/** If fewer than this share of similar tickets were ever escalated: resolve at L1. */
export const RESOLVE_BELOW_ESCALATION_RATE = 0.15;

/** If engineering fixed at least this share of past escalations: escalate. */
export const FIXED_RATE_TO_ESCALATE = 0.6;

/** Show the known-issue hint once this many past escalations were duplicates. */
export const KNOWN_ISSUE_HINT_AT = 3;

/**
 * Priorities that always go straight to engineering. A critical outage should
 * never wait on a checklist; the agent sends the checklist answers with it.
 */
export const FAST_TRACK_PRIORITIES: readonly string[] = ["P1"];

/** How many similar past tickets to show as examples. */
export const EXAMPLES_SHOWN = 3;

/* ------------------------------------------------------------------ */
/* Checklists (keys must match category names exactly)                 */
/* ------------------------------------------------------------------ */

/**
 * Basic checks L1 completes before escalating. Drafted from the ticket
 * descriptions and engineering's "returned to L1" outcomes; not yet validated
 * with the teams (see README "Assumptions").
 */
export const CHECKLISTS: Record<string, string[]> = {
  "Roster / booking not syncing": [
    "Confirm booking time vs the client's current cutoff setting",
    "Check the shift roster config for the affected shift",
    "Note affected employee IDs, booking IDs and the expected vs actual roster",
  ],
  "Live tracking / GPS incorrect": [
    "Check the driver app version and GPS permission",
    "Confirm the trip ID and when the issue started",
    "Check whether other cabs on the same route show the same problem",
  ],
  "Report export failing": [
    "Check the date range (over 15 days is a known failure)",
    "Try a smaller range or another format",
    "Check the known-issue list before escalating",
  ],
  "OTP / boarding issue": [
    "Confirm the OTP is for the correct trip and shift",
    "Check whether the OTP expired or was regenerated",
    "Note trip ID and driver app version",
  ],
  "Billing / invoice discrepancy": [
    "List the disputed trips against the client's records",
    "Check cancelled trips and dead-km rules",
    "Attach invoice number and period",
  ],
  "Cab delay / no-show complaint": [
    "Check trip logs for driver arrival time",
    "Get the driver and vehicle details",
    "Log the employee's pickup point",
  ],
  "Employee address / geocode change": [
    "Confirm the new address and pin location",
    "Check the effective date of the change",
    "Check for pending bookings on the old address",
  ],
  "How-to / feature request": [
    "Check the help docs for the answer",
    "Log the request in the feature backlog",
  ],
  "Login / access issue": [
    "Confirm the user's role and email",
    "Check for a recent password reset or lock",
    "Resend access or reset the user",
  ],
  "Driver / vehicle compliance docs": [
    "Check document expiry dates",
    "Confirm the vehicle's current assignment",
    "Request updated documents",
  ],
};

/* ------------------------------------------------------------------ */
/* App clock                                                            */
/* ------------------------------------------------------------------ */

/**
 * The dataset stops on 30 Sep 2026, but the app runs later. To keep new
 * activity in line with history, the app clock maps `realAnchor` to
 * `dataAnchor` and then moves forward in real time: one real minute is one app
 * minute, so ages and durations stay honest.
 *
 * Set DEMO_CLOCK=off in the environment to use the real date (live data).
 */
export const DEMO_CLOCK = {
  enabled: process.env.DEMO_CLOCK !== "off",
  realAnchor: "2026-11-19T00:00:00+05:30",
  dataAnchor: "2026-10-01T00:00:00+05:30",
} as const;

/** How long ticket rows stay cached in memory per server instance. */
export const TICKET_CACHE_MS = 60_000;
