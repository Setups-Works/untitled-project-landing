import { describe, expect, it } from "vitest";
import { addDays, monthGrid } from "./dates";
import { applyOpts, DEFAULT_OPTS, inView, nextDue, nthRuleFor, recurrenceLabel, upcomingDates } from "./tasks";
import type { HealthDay, Task } from "@untitled/types";
import {
  dayRange,
  daysInRange,
  healthPrompt,
  isHealthMetric,
  metricPrompt,
  metricRowText,
  metricSeries,
  metricsRecorded,
  parseRange,
  pickedDay,
  rangeMeta,
  stepRange,
  summarizeHealth,
} from "./health";

const task = (over: Partial<Task>): Task => ({
  id: "1",
  title: "t",
  description: "",
  priority: 4,
  list_id: null,
  due_date: null,
  done: false,
  done_at: null,
  cancelled: false,
  archived: false,
  recurrence: null,
  created_at: "2026-01-01T00:00:00Z",
  ...over,
});

describe("repeat rules", () => {
  it("finds the next occurrence", () => {
    expect(nextDue("2026-10-12", "daily", "2026-10-12")).toBe("2026-10-13");
    expect(nextDue("2026-10-09", "weekdays", "2026-10-09")).toBe("2026-10-12"); // Friday -> Monday
    expect(nextDue("2026-01-31", "monthly", "2026-01-31")).toBe("2026-02-28");
    expect(nextDue("2026-10-14", "nth:2:wed", "2026-10-14")).toBe("2026-11-11");
  });
  it("describes and lists them", () => {
    expect(nthRuleFor("2026-10-14")).toBe("nth:2:wed");
    expect(recurrenceLabel("nth:2:wed")).toBe("Every month on the 2nd Wednesday");
    expect(upcomingDates("2026-10-12", "weekly", "2026-10-30")).toEqual(["2026-10-19", "2026-10-26"]);
  });
});

describe("views", () => {
  const today = "2026-10-12";
  it("puts tasks in the right smart view", () => {
    expect(inView(task({ due_date: "2026-10-10" }), "today", today, false)).toBe(true);
    expect(inView(task({ due_date: "2026-10-13" }), "upcoming", today, false)).toBe(true);
    expect(inView(task({ list_id: "x" }), "inbox", today, false)).toBe(false);
    expect(inView(task({ done: true }), "completed", today, false)).toBe(true);
    expect(inView(task({ archived: true }), "inbox", today, false)).toBe(false);
  });
  it("sorts by date then priority filter", () => {
    const a = task({ id: "a", due_date: "2026-10-14", priority: 1 });
    const b = task({ id: "b", due_date: "2026-10-13", priority: 2 });
    expect(applyOpts([a, b], DEFAULT_OPTS).map((t) => t.id)).toEqual(["b", "a"]);
    expect(applyOpts([a, b], { ...DEFAULT_OPTS, priority: 1 }).map((t) => t.id)).toEqual(["a"]);
  });
});

describe("dates", () => {
  it("adds days and builds a 6-week grid", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    const g = monthGrid(2026, 9, 0);
    expect(g).toHaveLength(42);
    expect(g).toContain("2026-10-12");
  });
});

describe("health ranges", () => {
  const day = (d: string, over: Partial<HealthDay> = {}): HealthDay => ({
    day: d, steps: null, distance_m: null, active_kcal: null, resting_hr: null, hr_min: null, hr_max: null, sleep_minutes: null,
    source: "health_connect", synced_at: "", ...over,
  });
  const days = [day("2026-10-17", { steps: 1000 }), day("2026-10-16", { steps: 3000, sleep_minutes: 400, hr_min: 50, hr_max: 150 }), day("2026-10-11", { steps: 5000 }), day("2026-09-20", { steps: 9 })];

  it("picks the days for each filter", () => {
    expect(daysInRange(days, "today", "2026-10-17").map((d) => d.day)).toEqual(["2026-10-17"]);
    expect(daysInRange(days, "yesterday", "2026-10-17").map((d) => d.day)).toEqual(["2026-10-16"]);
    expect(daysInRange(days, "week", "2026-10-17").map((d) => d.day)).toEqual(["2026-10-17", "2026-10-16", "2026-10-11"]);
    expect(daysInRange(days, "month", "2026-10-17")).toHaveLength(4);
  });

  it("steps one day back and forward with the arrows, never past today", () => {
    const t = "2026-10-17";
    expect(stepRange("today", t, -1)).toBe("yesterday");
    expect(stepRange("yesterday", t, -1)).toBe("day:2026-10-15");
    expect(stepRange("day:2026-10-15", t, 1)).toBe("yesterday");
    expect(stepRange("yesterday", t, 1)).toBe("today");
    expect(stepRange("today", t, 1)).toBeNull();
    expect(stepRange("week", t, -1)).toBeNull();
    expect(stepRange("day:2026-10-11", t, 1)).toBe("day:2026-10-12");
  });

  it("counts the figures a day has", () => {
    expect(metricsRecorded(summarizeHealth([days[1]!]))).toBe(3);
    expect(metricsRecorded(summarizeHealth([]))).toBe(0);
  });

  it("picks one specific day from the calendar", () => {
    expect(daysInRange(days, dayRange("2026-10-11"), "2026-10-17").map((d) => d.day)).toEqual(["2026-10-11"]);
    expect(daysInRange(days, dayRange("2026-10-12"), "2026-10-17")).toEqual([]);
    expect(rangeMeta(dayRange("2026-10-11"), "2026-10-17")).toMatchObject({ from: "2026-10-11", to: "2026-10-11", days: 1 });
    expect(rangeMeta(dayRange("2026-10-17"), "2026-10-17").label).toBe("Today");
    expect(pickedDay(dayRange("2026-10-11"))).toBe("2026-10-11");
    expect(pickedDay("week")).toBeNull();
    expect(healthPrompt("ask", dayRange("2026-10-11"))).toContain("on 2026-10-11");
    expect(metricSeries(days, "steps", dayRange("2026-10-11"), "2026-10-17").points).toEqual([{ day: "2026-10-11", value: 5000 }]);
  });

  it("accepts only real ranges from outside input", () => {
    expect(parseRange("week")).toBe("week");
    expect(parseRange("day:2026-10-11")).toBe("day:2026-10-11");
    expect(parseRange("day:tomorrow")).toBeNull();
    expect(parseRange("<script>")).toBeNull();
    expect(parseRange(undefined)).toBeNull();
  });

  it("totals activity, averages the rest, and ignores gaps", () => {
    const s = summarizeHealth(daysInRange(days, "week", "2026-10-17"));
    expect(s).toMatchObject({ steps: 9000, stepsAvg: 3000, sleepAvg: 400, hrMin: 50, hrMax: 150, recorded: 3, distance: null });
    expect(summarizeHealth([]).steps).toBeNull();
  });

  it("builds a chat message per action and range", () => {
    expect(healthPrompt("journal", "yesterday")).toContain("yesterday");
    expect(healthPrompt("note", "week")).toContain("the last 7 days");
    expect(healthPrompt("ask", "today")).toContain("today");
  });
});

describe("one metric in detail", () => {
  const d = (day: string, over: Partial<HealthDay>): HealthDay => ({
    day, steps: null, distance_m: null, active_kcal: null, resting_hr: null, hr_min: null, hr_max: null, sleep_minutes: null,
    source: "health_connect", synced_at: "", ...over,
  });
  const days = [d("2026-10-17", { steps: 2000, hr_min: 48, hr_max: 120 }), d("2026-10-15", { steps: 8000, sleep_minutes: 420, hr_min: 55, hr_max: 160 })];

  it("returns every day of the range, with gaps as null", () => {
    const s = metricSeries(days, "steps", "week", "2026-10-17");
    expect(s.points).toHaveLength(7);
    expect(s.points[6]).toEqual({ day: "2026-10-17", value: 2000 });
    expect(s.points[5]).toEqual({ day: "2026-10-16", value: null });
  });

  it("adds up activity and finds the best and lowest day", () => {
    const s = metricSeries(days, "steps", "week", "2026-10-17");
    expect(s).toMatchObject({ headline: 10000, average: 5000, recorded: 2 });
    expect(s.best).toEqual({ day: "2026-10-15", value: 8000 });
    expect(s.lowest).toEqual({ day: "2026-10-17", value: 2000 });
  });

  it("averages sleep, and takes the lowest heart reading from any day", () => {
    expect(metricSeries(days, "sleep", "week", "2026-10-17").headline).toBe(420);
    const h = metricSeries(days, "heart", "week", "2026-10-17");
    expect(h.best).toEqual({ day: "2026-10-15", value: 160 });
    expect(h.lowest).toEqual({ day: "2026-10-17", value: 48 });
  });

  it("has nothing to say about a day without a reading", () => {
    const s = metricSeries(days, "steps", "yesterday", "2026-10-17");
    expect(s).toMatchObject({ headline: null, recorded: 0, best: null });
    expect(isHealthMetric("steps")).toBe(true);
    expect(isHealthMetric("nope")).toBe(false);
    expect(metricRowText("heart", days[0]!)).toBe("48–120 bpm");
    expect(metricPrompt("sleep", "week")).toContain("the last 7 days");
  });
});
