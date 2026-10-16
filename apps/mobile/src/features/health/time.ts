/** Start (inclusive) and end (exclusive) of a local calendar day. */
export function dayBounds(day: string) {
  const [y, m, d] = day.split("-").map(Number) as [number, number, number];
  return { start: new Date(y, m - 1, d), end: new Date(y, m - 1, d + 1) };
}

export type Interval = { start: number; end: number };

/**
 * Whole minutes covered by the intervals, counting overlaps once. A phone and a watch often both record the same night, and adding
 * their samples would double it.
 */
export function sleepMinutes(intervals: Interval[]) {
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  let covered = 0;
  let cursor = -Infinity;
  for (const { start, end } of sorted) {
    if (end <= cursor) continue;
    covered += end - Math.max(start, cursor);
    cursor = end;
  }
  return Math.round(covered / 60_000);
}
