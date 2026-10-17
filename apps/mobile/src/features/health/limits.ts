import type { DayTotals } from "./source.types";

/** The same bounds the server accepts (apps/web health.schema.ts), so one odd reading can't make a whole sync fail. */
const LIMITS = {
  steps: [0, 200_000],
  distance_m: [0, 500_000],
  active_kcal: [0, 20_000],
  resting_hr: [20, 250],
  hr_min: [20, 250],
  hr_max: [20, 250],
  sleep_minutes: [0, 1440],
} as const;

/**
 * Health services report "no reading" as 0 for heart rate, which is not a real pulse. A value outside what a person can have is
 * dropped to null (no data); a total that merely runs over its cap is clamped, since it is still real.
 */
export function sanitizeDay(day: DayTotals): DayTotals {
  const out = { ...day };
  for (const key of Object.keys(LIMITS) as (keyof typeof LIMITS)[]) {
    const v = out[key];
    if (v === null) continue;
    const [min, max] = LIMITS[key];
    const heart = key === "resting_hr" || key === "hr_min" || key === "hr_max";
    out[key] = !Number.isFinite(v) ? null : v < min ? (heart ? null : min) : v > max ? (heart ? null : max) : v;
  }
  return out;
}
