import { asleepMinutes, sleepWindow, type Interval } from "@untitled/logic";
import {
  aggregateGroupByDuration,
  getSdkStatus,
  initialize,
  openHealthConnectSettings,
  readRecords,
  requestPermission,
  SdkAvailabilityStatus,
} from "react-native-health-connect";

import { localDay, spanOf } from "./time";
import type { DayTotals, HealthSource } from "./source.types";

const PERMISSIONS = [
  { accessType: "read", recordType: "Steps" },
  { accessType: "read", recordType: "Distance" },
  { accessType: "read", recordType: "ActiveCaloriesBurned" },
  { accessType: "read", recordType: "HeartRate" },
  { accessType: "read", recordType: "RestingHeartRate" },
  { accessType: "read", recordType: "SleepSession" },
] as const;

const whole = (n: number | undefined) => (n === undefined || Number.isNaN(n) ? null : Math.round(n));

/** Health Connect sleep stages that are not sleep: awake (1) and out of bed (3). Light, deep, REM, generic and unknown all count. */
const NOT_ASLEEP: ReadonlySet<number> = new Set([1, 3]);

type Range = { operator: "between"; startTime: string; endTime: string };

/** Per-day results for one metric, keyed by local day. A metric the person did not allow (or never recorded) is simply empty. */
async function perDay<T>(read: () => Promise<{ result: T; startTime: string; endTime: string }[]>) {
  const byDay = new Map<string, T>();
  const slices = await read().catch(() => []);
  for (const s of slices) {
    // Slices are tagged by their middle, so a 23- or 25-hour day (clocks changing) still lands on its own date.
    const mid = new Date((new Date(s.startTime).getTime() + new Date(s.endTime).getTime()) / 2);
    byDay.set(localDay(mid), s.result);
  }
  return byDay;
}

/** Sleep sessions overlapping the sync, as the intervals actually spent asleep (awake stretches inside a session are left out). */
async function sleepIntervals(first: string, last: string): Promise<Interval[]> {
  const timeRangeFilter: Range = {
    operator: "between",
    startTime: new Date(sleepWindow(first).start).toISOString(),
    endTime: new Date(sleepWindow(last).end).toISOString(),
  };
  const sessions = await readRecords("SleepSession", { timeRangeFilter }).catch(() => ({ records: [] }));
  const out: Interval[] = [];
  for (const s of sessions.records) {
    const stages = s.stages ?? [];
    if (stages.length) {
      for (const st of stages) {
        if (!NOT_ASLEEP.has(st.stage)) out.push({ start: new Date(st.startTime).getTime(), end: new Date(st.endTime).getTime() });
      }
    } else out.push({ start: new Date(s.startTime).getTime(), end: new Date(s.endTime).getTime() });
  }
  return out;
}

/**
 * Reads all the days with one grouped query per metric, not one per metric per day: the whole sync is a handful of calls.
 * Health Connect already removes duplicates between apps and devices using the person's app priority, so the totals are its own.
 */
async function readDays(days: string[]): Promise<DayTotals[]> {
  const { start, end } = spanOf(days);
  const timeRangeFilter: Range = { operator: "between", startTime: start.toISOString(), endTime: end.toISOString() };
  const timeRangeSlicer = { duration: "DAYS", length: 1 } as const;
  const sorted = [...days].sort();
  const [steps, distance, energy, heart, resting, asleep] = await Promise.all([
    perDay(() => aggregateGroupByDuration({ recordType: "Steps", timeRangeFilter, timeRangeSlicer })),
    perDay(() => aggregateGroupByDuration({ recordType: "Distance", timeRangeFilter, timeRangeSlicer })),
    perDay(() => aggregateGroupByDuration({ recordType: "ActiveCaloriesBurned", timeRangeFilter, timeRangeSlicer })),
    perDay(() => aggregateGroupByDuration({ recordType: "HeartRate", timeRangeFilter, timeRangeSlicer })),
    perDay(() => aggregateGroupByDuration({ recordType: "RestingHeartRate", timeRangeFilter, timeRangeSlicer })),
    sleepIntervals(sorted[0]!, sorted[sorted.length - 1]!),
  ]);
  return days.map((day) => {
    const minutes = asleepMinutes(asleep, sleepWindow(day));
    return {
      day,
      steps: whole(steps.get(day)?.COUNT_TOTAL),
      distance_m: whole(distance.get(day)?.DISTANCE?.inMeters),
      active_kcal: whole(energy.get(day)?.ACTIVE_CALORIES_TOTAL?.inKilocalories),
      hr_min: whole(heart.get(day)?.BPM_MIN),
      hr_max: whole(heart.get(day)?.BPM_MAX),
      resting_hr: whole(resting.get(day)?.BPM_AVG),
      sleep_minutes: minutes > 0 ? minutes : null,
    };
  });
}

export const healthSource: HealthSource | null = {
  id: "health_connect",
  name: "Health Connect",
  isAvailable: async () => (await getSdkStatus()) === SdkAvailabilityStatus.SDK_AVAILABLE && (await initialize()),
  requestAccess: async () => {
    if (!(await initialize())) return false;
    const granted = await requestPermission([...PERMISSIONS]);
    return granted.length > 0;
  },
  readDays,
  openSettings: () => openHealthConnectSettings(),
};
