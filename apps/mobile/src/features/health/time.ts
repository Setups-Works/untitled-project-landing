/** Start (inclusive) and end (exclusive) of a local calendar day. */
export function dayBounds(day: string) {
  const [y, m, d] = day.split("-").map(Number) as [number, number, number];
  return { start: new Date(y, m - 1, d), end: new Date(y, m - 1, d + 1) };
}

/** One range covering all the given local days, so a whole sync can be read with a single query per metric. */
export function spanOf(days: string[]) {
  const sorted = [...days].sort();
  return { start: dayBounds(sorted[0]!).start, end: dayBounds(sorted[sorted.length - 1]!).end };
}

/** The local calendar day (YYYY-MM-DD) of a moment. Slices are tagged by their middle, so a 23- or 25-hour day still lands on its own date. */
export function localDay(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
