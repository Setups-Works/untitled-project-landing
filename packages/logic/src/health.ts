import type { HealthDay } from "@untitled/types";
import { addDays } from "./dates";

/** Daily targets the rings measure against, and the windows the screens read. Shared so web, phone and chat agree. */
export const HEALTH_GOALS = { steps: 10_000, sleepMinutes: 8 * 60 } as const;
/** How many days the screens and chat read back; the longest filter is 30 days. */
export const HEALTH_SPAN = 30;
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

/* ---------- date filter, shared by the web page and the phone app ---------- */

export type HealthRange = "today" | "yesterday" | "week" | "month";

export const HEALTH_RANGES: { key: HealthRange; label: string; days: number; phrase: string }[] = [
  { key: "today", label: "Today", days: 1, phrase: "today" },
  { key: "yesterday", label: "Yesterday", days: 1, phrase: "yesterday" },
  { key: "week", label: "7 days", days: 7, phrase: "the last 7 days" },
  { key: "month", label: "30 days", days: 30, phrase: "the last 30 days" },
];

/** The stored days that fall inside the range, newest first. `today` is the person's local date (YYYY-MM-DD). */
export function daysInRange(days: HealthDay[], range: HealthRange, today: string): HealthDay[] {
  const yesterday = addDays(today, -1);
  const from = range === "week" ? addDays(today, -6) : range === "month" ? addDays(today, -29) : range === "yesterday" ? yesterday : today;
  const to = range === "yesterday" ? yesterday : today;
  return days.filter((d) => d.day >= from && d.day <= to).sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : 0));
}

export type HealthSummary = {
  /** Days in the range that have any reading at all. */
  recorded: number;
  steps: number | null;
  stepsAvg: number | null;
  sleepAvg: number | null;
  distance: number | null;
  activeKcal: number | null;
  hrMin: number | null;
  hrMax: number | null;
  restingAvg: number | null;
};

const present = (v: number | null): v is number => v !== null;
const sum = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) : null);
const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);

/** Totals for activity, averages for sleep and resting heart rate, and the overall heart-rate span. A metric nobody recorded is null. */
export function summarizeHealth(days: HealthDay[]): HealthSummary {
  const col = (pick: (d: HealthDay) => number | null) => days.map(pick).filter(present);
  const steps = col((d) => d.steps);
  const lows = col((d) => d.hr_min);
  const highs = col((d) => d.hr_max);
  return {
    recorded: days.filter((d) => [d.steps, d.distance_m, d.active_kcal, d.resting_hr, d.hr_min, d.hr_max, d.sleep_minutes].some(present)).length,
    steps: sum(steps),
    stepsAvg: avg(steps),
    sleepAvg: avg(col((d) => d.sleep_minutes)),
    distance: sum(col((d) => d.distance_m)),
    activeKcal: sum(col((d) => d.active_kcal)),
    hrMin: lows.length ? Math.min(...lows) : null,
    hrMax: highs.length ? Math.max(...highs) : null,
    restingAvg: avg(col((d) => d.resting_hr)),
  };
}

/* ---------- actions that hand the health data to the assistant ---------- */

export type HealthAction = "ask" | "journal" | "note";

export const HEALTH_ACTIONS: { key: HealthAction; label: string }[] = [
  { key: "ask", label: "Ask the assistant" },
  { key: "journal", label: "Add to journal" },
  { key: "note", label: "Save as note" },
];

/**
 * The message a Health action sends to the chat. The assistant already has the person's health numbers (see the chat prompt),
 * and notes and journal entries are drafts the person confirms in the chat, like any other chat action.
 */
export function healthPrompt(action: HealthAction, range: HealthRange): string {
  const when = HEALTH_RANGES.find((r) => r.key === range)?.phrase ?? "today";
  if (action === "journal") return `Write a short journal entry about my health ${when}: activity, sleep and heart rate. Add it to my journal.`;
  if (action === "note") return `Summarize my health ${when} (steps, distance, active energy, sleep and heart rate) in a note.`;
  return `How was my health ${when}? Point out anything worth noticing.`;
}
