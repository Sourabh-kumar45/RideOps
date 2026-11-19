/** Small, dependency-free statistics helpers used by the services. */

/** Median of a list; null for an empty list. */
export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** part / whole as 0..1; null when the whole is 0 (undefined, not 0%). */
export function share(part: number, whole: number): number | null {
  return whole === 0 ? null : part / whole;
}

/** Counts items for which `predicate` is true. */
export function countWhere<T>(items: readonly T[], predicate: (item: T) => boolean): number {
  let n = 0;
  for (const item of items) if (predicate(item)) n++;
  return n;
}

/** Drops nulls, keeping the type narrow. */
export function present<T>(values: (T | null | undefined)[]): T[] {
  return values.filter((v): v is T => v !== null && v !== undefined);
}
