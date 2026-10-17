import { asleepMinutes, sleepWindow, type Interval } from "@untitled/logic";
import { Linking, TurboModuleRegistry } from "react-native";

import { localDay, spanOf } from "./time";
import type { DayTotals, HealthSource } from "./source.types";

type HealthKit = typeof import("@kingstinct/react-native-healthkit");

/**
 * Loaded on first use, not at startup: an app build made before the native module was added would otherwise fail to open at all.
 * Without the module Health simply reads as unavailable.
 */
function healthKit(): HealthKit | null {
  // The library reports a missing native module itself (a red box in development) while it loads, so look before requiring it.
  if (!TurboModuleRegistry.get("NitroModules")) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("@kingstinct/react-native-healthkit") as HealthKit;
  } catch {
    return null;
  }
}

const READ = [
  "HKQuantityTypeIdentifierStepCount",
  "HKQuantityTypeIdentifierDistanceWalkingRunning",
  "HKQuantityTypeIdentifierActiveEnergyBurned",
  "HKQuantityTypeIdentifierHeartRate",
  "HKQuantityTypeIdentifierRestingHeartRate",
  "HKCategoryTypeIdentifierSleepAnalysis",
] as const;

/** HKCategoryValueSleepAnalysis: every "asleep" stage. In bed (0) and awake (2) do not count as sleep. */
const ASLEEP_VALUES: ReadonlySet<number> = new Set([1, 3, 4, 5]);

type Stats = Awaited<ReturnType<HealthKit["queryStatisticsCollectionForQuantity"]>>;

/** Index per-day statistics by local day. A day with no samples has no entry. */
function byDay(stats: Stats) {
  const m = new Map<string, Stats[number]>();
  for (const s of stats) if (s.startDate) m.set(localDay(new Date(s.startDate)), s);
  return m;
}

/**
 * One statistics-collection query per metric covers every day (HealthKit buckets it by calendar day and removes the overlap
 * between your phone and watch itself), instead of one query per metric per day.
 */
async function readDays(hk: HealthKit, days: string[]): Promise<DayTotals[]> {
  const { queryStatisticsCollectionForQuantity: collect, queryCategorySamples } = hk;
  const { start, end } = spanOf(days);
  const filter = { date: { startDate: start, endDate: end } };
  const interval = { day: 1 };
  const sorted = [...days].sort();
  const sleepFilter = {
    date: { startDate: new Date(sleepWindow(sorted[0]!).start), endDate: new Date(sleepWindow(sorted[sorted.length - 1]!).end) },
  };
  const [steps, distance, energy, heart, resting, sleep] = await Promise.all([
    collect("HKQuantityTypeIdentifierStepCount", ["cumulativeSum"], start, interval, { filter, unit: "count" }),
    collect("HKQuantityTypeIdentifierDistanceWalkingRunning", ["cumulativeSum"], start, interval, { filter, unit: "m" }),
    collect("HKQuantityTypeIdentifierActiveEnergyBurned", ["cumulativeSum"], start, interval, { filter, unit: "kcal" }),
    collect("HKQuantityTypeIdentifierHeartRate", ["discreteMin", "discreteMax"], start, interval, { filter, unit: "count/min" }),
    collect("HKQuantityTypeIdentifierRestingHeartRate", ["discreteAverage"], start, interval, { filter, unit: "count/min" }),
    queryCategorySamples("HKCategoryTypeIdentifierSleepAnalysis", { filter: sleepFilter, limit: 0 }),
  ]);
  const [stepsBy, distanceBy, energyBy, heartBy, restingBy] = [steps, distance, energy, heart, resting].map(byDay);
  // Sleep belongs to the day you wake up, so each day counts the asleep time inside its own 18:00-to-18:00 window.
  const asleep: Interval[] = sleep
    .filter((s) => ASLEEP_VALUES.has(Number(s.value)))
    .map((s) => ({ start: new Date(s.startDate).getTime(), end: new Date(s.endDate).getTime() }));
  const whole = (n: number | undefined) => (n === undefined ? null : Math.round(n));
  return days.map((day) => {
    const minutes = asleepMinutes(asleep, sleepWindow(day));
    return {
      day,
      steps: whole(stepsBy.get(day)?.sumQuantity?.quantity),
      distance_m: whole(distanceBy.get(day)?.sumQuantity?.quantity),
      active_kcal: whole(energyBy.get(day)?.sumQuantity?.quantity),
      hr_min: whole(heartBy.get(day)?.minimumQuantity?.quantity),
      hr_max: whole(heartBy.get(day)?.maximumQuantity?.quantity),
      resting_hr: whole(restingBy.get(day)?.averageQuantity?.quantity),
      sleep_minutes: minutes > 0 ? minutes : null,
    };
  });
}

export const healthSource: HealthSource | null = {
  id: "healthkit",
  name: "Apple Health",
  isAvailable: () => Promise.resolve(healthKit()?.isHealthDataAvailable() ?? false),
  requestAccess: async () => (await healthKit()?.requestAuthorization({ toRead: READ })) ?? false,
  readDays: async (days) => {
    const hk = healthKit();
    return hk ? readDays(hk, days) : [];
  },
  // Health permissions live inside the Health app; the app's own Settings page is the closest reliable link.
  openSettings: () => void Linking.openSettings(),
};
