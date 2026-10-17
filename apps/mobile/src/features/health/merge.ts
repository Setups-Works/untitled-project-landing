import type { HealthDay } from "@untitled/types";

const METRICS = ["steps", "distance_m", "active_kcal", "resting_hr", "hr_min", "hr_max", "sleep_minutes"] as const;

/**
 * One list of days, newest first, from what the account has stored and what the phone just read. For each day and each metric the
 * stored value wins; the phone fills any gap, so data shows up even when saving it to the account failed or hasn't finished.
 */
export function mergeDays(stored: HealthDay[], phone: HealthDay[]): HealthDay[] {
  const byDay = new Map<string, HealthDay>();
  for (const d of stored) byDay.set(d.day, { ...d });
  for (const p of phone) {
    const have = byDay.get(p.day);
    if (!have) {
      byDay.set(p.day, { ...p });
      continue;
    }
    for (const k of METRICS) have[k] ??= p[k];
  }
  return [...byDay.values()].sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : 0));
}
