export type Interval = { start: number; end: number };

/**
 * The span of time whose sleep counts for a calendar day: 18:00 the evening before to 18:00 that day, in the device's time zone.
 * Sleep belongs to the day you wake up, so a night from 23:00 to 07:00 counts once, for the morning it ends on, and a late nap
 * counts for its own day. The windows of consecutive days touch without overlapping, so no minute is counted twice.
 */
export function sleepWindow(day: string): Interval {
  const [y, m, d] = day.split("-").map(Number) as [number, number, number];
  return { start: new Date(y, m - 1, d - 1, 18).getTime(), end: new Date(y, m - 1, d, 18).getTime() };
}

/**
 * Whole minutes asleep inside `window`. Intervals are cut to the window first, then overlaps are counted once: a phone and a watch
 * often both record the same night, and adding their samples would double it.
 */
export function asleepMinutes(intervals: Interval[], window: Interval): number {
  const clipped = intervals
    .map((i) => ({ start: Math.max(i.start, window.start), end: Math.min(i.end, window.end) }))
    .filter((i) => i.end > i.start)
    .sort((a, b) => a.start - b.start);
  let covered = 0;
  let cursor = -Infinity;
  for (const { start, end } of clipped) {
    if (end <= cursor) continue;
    covered += end - Math.max(start, cursor);
    cursor = end;
  }
  return Math.round(covered / 60_000);
}
