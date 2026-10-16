import { Linking, TurboModuleRegistry } from "react-native";

import { dayBounds, sleepMinutes, type Interval } from "./time";
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

async function readDay(hk: HealthKit, day: string): Promise<DayTotals> {
  const { queryStatisticsForQuantity, queryCategorySamples } = hk;
  const { start, end } = dayBounds(day);
  const filter = { date: { startDate: start, endDate: end } };
  const [steps, distance, energy, heart, resting, sleep] = await Promise.all([
    queryStatisticsForQuantity("HKQuantityTypeIdentifierStepCount", ["cumulativeSum"], { filter, unit: "count" }),
    queryStatisticsForQuantity("HKQuantityTypeIdentifierDistanceWalkingRunning", ["cumulativeSum"], { filter, unit: "m" }),
    queryStatisticsForQuantity("HKQuantityTypeIdentifierActiveEnergyBurned", ["cumulativeSum"], { filter, unit: "kcal" }),
    queryStatisticsForQuantity("HKQuantityTypeIdentifierHeartRate", ["discreteMin", "discreteMax"], { filter, unit: "count/min" }),
    queryStatisticsForQuantity("HKQuantityTypeIdentifierRestingHeartRate", ["discreteAverage"], { filter, unit: "count/min" }),
    // Sleep belongs to the day it ends on, so a night that started yesterday evening counts for today.
    queryCategorySamples("HKCategoryTypeIdentifierSleepAnalysis", { filter, limit: 0 }),
  ]);
  const asleep: Interval[] = sleep
    .filter((s) => ASLEEP_VALUES.has(Number(s.value)))
    .map((s) => ({ start: new Date(s.startDate).getTime(), end: new Date(s.endDate).getTime() }));
  const whole = (n: number | undefined) => (n === undefined ? null : Math.round(n));
  return {
    day,
    steps: whole(steps.sumQuantity?.quantity),
    distance_m: whole(distance.sumQuantity?.quantity),
    active_kcal: whole(energy.sumQuantity?.quantity),
    hr_min: whole(heart.minimumQuantity?.quantity),
    hr_max: whole(heart.maximumQuantity?.quantity),
    resting_hr: whole(resting.averageQuantity?.quantity),
    sleep_minutes: asleep.length ? sleepMinutes(asleep) : null,
  };
}

export const healthSource: HealthSource | null = {
  id: "healthkit",
  name: "Apple Health",
  isAvailable: () => Promise.resolve(healthKit()?.isHealthDataAvailable() ?? false),
  requestAccess: async () => (await healthKit()?.requestAuthorization({ toRead: READ })) ?? false,
  readDays: async (days) => {
    const hk = healthKit();
    return hk ? Promise.all(days.map((d) => readDay(hk, d))) : [];
  },
  // Health permissions live inside the Health app; the app's own Settings page is the closest reliable link.
  openSettings: () => void Linking.openSettings(),
};
