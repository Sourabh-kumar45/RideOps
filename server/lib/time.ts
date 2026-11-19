/**
 * Clock and date helpers.
 *
 * Ticket times are stored as real instants. Weeks are cut in IST (Monday
 * 00:00), matching how the support team reports.
 */
import { DEMO_CLOCK } from "../config";

const HOUR_MS = 3_600_000;
export const DAY_MS = 24 * HOUR_MS;
const IST_OFFSET_MS = 5.5 * HOUR_MS;

/** Real-to-app clock offset, fixed at startup (0 when the demo clock is off). */
const clockOffsetMs = DEMO_CLOCK.enabled
  ? Date.parse(DEMO_CLOCK.realAnchor) - Date.parse(DEMO_CLOCK.dataAnchor)
  : 0;

/** The app's "now". Use this instead of `new Date()` everywhere on the server. */
export function now(): Date {
  return new Date(Date.now() - clockOffsetMs);
}

/** Hours from `from` to `to` (fractional). */
export function hoursBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / HOUR_MS;
}

/** Start of the IST week (Monday 00:00 IST) containing `date`, as an instant. */
export function istWeekStart(date: Date): Date {
  // Shift into IST so the UTC getters read IST wall-clock values.
  const local = new Date(date.getTime() + IST_OFFSET_MS);
  const daysSinceMonday = (local.getUTCDay() + 6) % 7;
  local.setUTCHours(0, 0, 0, 0);
  local.setUTCDate(local.getUTCDate() - daysSinceMonday);
  return new Date(local.getTime() - IST_OFFSET_MS);
}

/** IST calendar date of an instant, as YYYY-MM-DD. */
export function istDateLabel(date: Date): string {
  return new Date(date.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}
