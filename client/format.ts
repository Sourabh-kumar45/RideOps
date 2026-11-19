/**
 * Display formatting. All dates are shown in IST.
 *
 * Dates are formatted by hand rather than with toLocaleString, because
 * browsers disagree on short month names ("Sep" vs "Sept").
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const IST_OFFSET_MS = 5.5 * 3_600_000;

/** Shifts an instant so the UTC getters return IST wall-clock values. */
const toIst = (iso: string) => new Date(new Date(iso).getTime() + IST_OFFSET_MS);
const pad = (n: number) => String(n).padStart(2, "0");

/** 0.523 → "52%"; null → "–". */
export function pct(value: number | null | undefined): string {
  return value === null || value === undefined ? "–" : `${Math.round(value * 100)}%`;
}

/** Hours as a friendly duration: "under 1h", "14h", "3.5 days". */
export function duration(hours: number | null | undefined): string {
  if (hours === null || hours === undefined) return "–";
  if (hours < 1) return "under 1h";
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${(hours / 24).toFixed(1)} days`;
}

/** Short age for lists: "5h", "3d". */
export function shortAge(hours: number): string {
  return hours < 48 ? `${Math.max(1, Math.round(hours))}h` : `${Math.round(hours / 24)}d`;
}

/** "2026-09-28" → "28 Sep". */
export function dayMonth(isoDate: string): string {
  const [, month, day] = isoDate.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]}`;
}

/** ISO instant → "1 Oct 2026". */
export function longDate(iso: string): string {
  const d = toIst(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** ISO instant → "1 Oct, 14:05". */
export function dateTime(iso: string): string {
  const d = toIst(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}, ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

/** "Priya D" → "Priya". */
export function firstName(name: string): string {
  return name.split(" ")[0] ?? name;
}
