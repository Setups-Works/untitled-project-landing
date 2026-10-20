import type { HealthDay, Tone } from "@untitled/types";
import { addDays, dayLabel } from "./dates";

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

/** The quick filters. */
export type HealthPreset = "today" | "yesterday" | "week" | "month";
/** One specific day picked from the calendar, like the Journal: `day:2026-10-12`. */
export type HealthDayRange = `day:${string}`;
export type HealthRange = HealthPreset | HealthDayRange;

export const HEALTH_RANGES: { key: HealthPreset; label: string; days: number; phrase: string }[] = [
  { key: "today", label: "Today", days: 1, phrase: "today" },
  { key: "yesterday", label: "Yesterday", days: 1, phrase: "yesterday" },
  { key: "week", label: "7 days", days: 7, phrase: "the last 7 days" },
  { key: "month", label: "30 days", days: 30, phrase: "the last 30 days" },
];

export const dayRange = (iso: string): HealthDayRange => `day:${iso}`;

/** The range a `?d=YYYY-MM-DD` address opens on the Health page: that day, "today" for today, and today for anything missing or in the future. */
export const rangeForDay = (iso: string | null | undefined, today: string): HealthRange =>
  iso && /^\d{4}-\d{2}-\d{2}$/.test(iso) && iso < today ? dayRange(iso) : "today";

/** The in-app link to the Health page, for a day when one is given. Notes use it to point back at the figures they summarise. */
export const healthLink = (day?: string) => (day ? `/dashboard/health?d=${day}` : "/dashboard/health");
/** The picked day (YYYY-MM-DD) of a `day:` range, or null for a quick filter. */
export const pickedDay = (range: HealthRange): string | null => (range.startsWith("day:") ? range.slice(4) : null);
/** Accepts only a real range from outside input (a link's query string), never an arbitrary string. */
export const parseRange = (v: unknown): HealthRange | null =>
  typeof v === "string" && (HEALTH_RANGES.some((r) => r.key === v) || /^day:\d{4}-\d{2}-\d{2}$/.test(v)) ? (v as HealthRange) : null;

/** How the assistant is told which period is meant ("today", "the last 7 days", "on 2026-10-12"). It doesn't depend on today's date. */
export const rangePhrase = (range: HealthRange): string => {
  const iso = pickedDay(range);
  return iso ? `on ${iso}` : (HEALTH_RANGES.find((r) => r.key === range)?.phrase ?? "today");
};

export type RangeMeta = { from: string; to: string; days: number; label: string; phrase: string };

/**
 * What a range covers: the first and last day (inclusive), how many days, a short label for headings and the phrase the assistant
 * is asked about. `today` is the person's local date (YYYY-MM-DD).
 */
export function rangeMeta(range: HealthRange, today: string): RangeMeta {
  const iso = pickedDay(range);
  if (iso) return { from: iso, to: iso, days: 1, label: dayLabel(iso, today), phrase: `on ${iso}` };
  const p = HEALTH_RANGES.find((r) => r.key === range) ?? HEALTH_RANGES[0]!;
  const to = p.key === "yesterday" ? addDays(today, -1) : today;
  return { from: addDays(to, -(p.days - 1)), to, days: p.days, label: p.label, phrase: p.phrase };
}

/**
 * The range one day earlier (delta -1) or later (+1), for the ‹ › arrows. Only a single-day view steps; a 7- or 30-day window, or a
 * step past today, returns null. The result is "today" or "yesterday" when it lands there, so the matching pill lights up.
 */
export function stepRange(range: HealthRange, today: string, delta: 1 | -1): HealthRange | null {
  const meta = rangeMeta(range, today);
  if (meta.days !== 1) return null;
  const next = addDays(meta.from, delta);
  if (next > today) return null;
  return next === today ? "today" : next === addDays(today, -1) ? "yesterday" : dayRange(next);
}

/** How many of the six figures (steps, sleep, distance, energy, heart rate, resting heart rate) a day has. */
export const metricsRecorded = (s: Pick<HealthSummary, "steps" | "sleepAvg" | "distance" | "activeKcal" | "hrMin" | "hrMax" | "restingAvg">) =>
  [s.steps, s.sleepAvg, s.distance, s.activeKcal, s.hrMin !== null && s.hrMax !== null ? 1 : null, s.restingAvg].filter((v) => v !== null).length;

/** The stored days that fall inside the range, newest first. */
export function daysInRange(days: HealthDay[], range: HealthRange, today: string): HealthDay[] {
  const { from, to } = rangeMeta(range, today);
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
  const when = rangePhrase(range);
  if (action === "journal") return `Write a short journal entry about my health ${when}: activity, sleep and heart rate. Add it to my journal.`;
  if (action === "note") return `Summarize my health ${when} (steps, distance, active energy, sleep and heart rate) in a note.`;
  return `How was my health ${when}? Point out anything worth noticing.`;
}

/* ---------- one metric in detail (the screen a tile opens) ---------- */

export type HealthMetric = "steps" | "sleep" | "distance" | "energy" | "heart" | "resting";

type MetricDef = {
  label: string;
  tone: Tone;
  /** How the range is summed up: activity adds up, the rest is averaged. */
  kind: "total" | "average";
  /** The value of one day, or null when it was not recorded. Heart rate uses the day's highest reading. */
  pick: (d: HealthDay) => number | null;
  format: (n: number) => string;
  /** Per-day goal, when there is one. */
  goal?: number;
  /** What the assistant is asked about. */
  topic: string;
};

export const HEALTH_METRICS: Record<HealthMetric, MetricDef> = {
  steps: { label: "Steps", tone: "green", kind: "total", pick: (d) => d.steps, format: fmtNumber, goal: HEALTH_GOALS.steps, topic: "my steps" },
  sleep: {
    label: "Sleep",
    tone: "violet",
    kind: "average",
    pick: (d) => d.sleep_minutes,
    format: fmtDuration,
    goal: HEALTH_GOALS.sleepMinutes,
    topic: "my sleep",
  },
  distance: { label: "Distance", tone: "mint", kind: "total", pick: (d) => d.distance_m, format: fmtDistance, topic: "the distance I covered" },
  energy: {
    label: "Active energy",
    tone: "amber",
    kind: "total",
    pick: (d) => d.active_kcal,
    format: (n) => `${fmtNumber(n)} kcal`,
    topic: "my active energy",
  },
  heart: { label: "Heart rate", tone: "clay", kind: "average", pick: (d) => d.hr_max, format: (n) => `${n} bpm`, topic: "my heart rate" },
  resting: {
    label: "Resting heart rate",
    tone: "blue",
    kind: "average",
    pick: (d) => d.resting_hr,
    format: (n) => `${n} bpm`,
    topic: "my resting heart rate",
  },
};

export const HEALTH_METRIC_KEYS = Object.keys(HEALTH_METRICS) as HealthMetric[];
export const isHealthMetric = (v: unknown): v is HealthMetric => typeof v === "string" && v in HEALTH_METRICS;

export type MetricPoint = { day: string; value: number | null };

export type MetricSeries = {
  /** Every day of the range, oldest first, so a chart has no holes in its axis. */
  points: MetricPoint[];
  /** Days with a reading. */
  recorded: number;
  /** The headline: the total for activity, the average for the rest. */
  headline: number | null;
  average: number | null;
  best: MetricPoint | null;
  lowest: MetricPoint | null;
};

/** One metric over a range, ready to draw and to list. `today` is the person's local date. */
export function metricSeries(days: HealthDay[], metric: HealthMetric, range: HealthRange, today: string): MetricSeries {
  const def = HEALTH_METRICS[metric];
  const { days: span, to: last } = rangeMeta(range, today);
  const byDay = new Map(days.map((d) => [d.day, def.pick(d)]));
  const points = Array.from({ length: span }, (_, i) => {
    const day = addDays(last, -(span - 1 - i));
    return { day, value: byDay.get(day) ?? null };
  });
  const got = points.filter((p): p is { day: string; value: number } => p.value !== null);
  const total = got.reduce((a, p) => a + p.value, 0);
  const average = got.length ? Math.round(total / got.length) : null;
  const pickBy = (better: (a: number, b: number) => boolean) => got.reduce<MetricPoint | null>((m, p) => (!m || better(p.value, m.value!) ? p : m), null);
  // For heart rate the lowest is the lowest reading of any day, not the lowest daily peak.
  const lowestHeart = metric === "heart" ? days.filter((d) => d.hr_min !== null && points.some((p) => p.day === d.day)).sort((a, b) => a.hr_min! - b.hr_min!)[0] : undefined;
  return {
    points,
    recorded: got.length,
    headline: got.length ? (def.kind === "total" ? total : average) : null,
    average,
    best: pickBy((a, b) => a > b),
    lowest: lowestHeart ? { day: lowestHeart.day, value: lowestHeart.hr_min } : pickBy((a, b) => a < b),
  };
}

/** The text of one day's row in the detail list; heart rate shows its whole span, the rest the single value. */
export function metricRowText(metric: HealthMetric, d: HealthDay): string | null {
  if (metric === "heart") return fmtHeartRange(d);
  const v = HEALTH_METRICS[metric].pick(d);
  return v === null ? null : HEALTH_METRICS[metric].format(v);
}

/** The chat message for "ask the assistant about this metric". */
export function metricPrompt(metric: HealthMetric, range: HealthRange): string {
  const when = rangePhrase(range);
  return `Look at ${HEALTH_METRICS[metric].topic} ${when}. What stands out, and what could I do to improve it?`;
}
