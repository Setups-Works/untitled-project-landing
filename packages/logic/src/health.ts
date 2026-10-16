import type { HealthDay } from "@untitled/types";

/** Daily targets the rings measure against, and the windows the screens read. Shared so web, phone and chat agree. */
export const HEALTH_GOALS = { steps: 10_000, sleepMinutes: 8 * 60 } as const;
export const HEALTH_SPAN = 14;
export const HEALTH_WEEK = 7;

export const SOURCE_LABEL: Record<HealthDay["source"], string> = {
  healthkit: "Apple Health",
  health_connect: "Health Connect",
  unknown: "your phone",
};

export const fmtNumber = (n: number) => n.toLocaleString();

export function fmtDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}

export const fmtDistance = (meters: number) => (meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`);

export const fmtHeartRange = (d: Pick<HealthDay, "hr_min" | "hr_max">) =>
  d.hr_min === null || d.hr_max === null ? null : `${d.hr_min}–${d.hr_max} bpm`;

/** Sum of a metric over the given days, ignoring days where it was not recorded. */
export function healthTotal(days: HealthDay[], pick: (d: HealthDay) => number | null) {
  return days.reduce((sum, d) => sum + (pick(d) ?? 0), 0);
}

/** 0–1, capped, for ring and bar fill. */
export const healthRatio = (value: number, goal: number) => (goal > 0 ? Math.min(Math.max(value / goal, 0), 1) : 0);
