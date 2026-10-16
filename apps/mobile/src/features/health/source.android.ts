import {
  aggregateRecord,
  getSdkStatus,
  initialize,
  openHealthConnectSettings,
  requestPermission,
  SdkAvailabilityStatus,
} from "react-native-health-connect";

import { dayBounds } from "./time";
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

async function readDay(day: string): Promise<DayTotals> {
  const { start, end } = dayBounds(day);
  const timeRangeFilter = { operator: "between", startTime: start.toISOString(), endTime: end.toISOString() } as const;
  // Each aggregate is independent: a metric the person did not allow (or never recorded) is just null, not a failed sync.
  const safe = async <T>(run: () => Promise<T>): Promise<T | undefined> => run().catch(() => undefined);
  const [steps, distance, energy, heart, resting, sleep] = await Promise.all([
    safe(() => aggregateRecord({ recordType: "Steps", timeRangeFilter })),
    safe(() => aggregateRecord({ recordType: "Distance", timeRangeFilter })),
    safe(() => aggregateRecord({ recordType: "ActiveCaloriesBurned", timeRangeFilter })),
    safe(() => aggregateRecord({ recordType: "HeartRate", timeRangeFilter })),
    safe(() => aggregateRecord({ recordType: "RestingHeartRate", timeRangeFilter })),
    safe(() => aggregateRecord({ recordType: "SleepSession", timeRangeFilter })),
  ]);
  const sleepSeconds = sleep?.SLEEP_DURATION_TOTAL;
  return {
    day,
    steps: whole(steps?.COUNT_TOTAL),
    distance_m: whole(distance?.DISTANCE.inMeters),
    active_kcal: whole(energy?.ACTIVE_CALORIES_TOTAL.inKilocalories),
    hr_min: whole(heart?.BPM_MIN),
    hr_max: whole(heart?.BPM_MAX),
    resting_hr: whole(resting?.BPM_AVG),
    sleep_minutes: sleepSeconds === undefined ? null : Math.round(sleepSeconds / 60),
  };
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
  readDays: (days) => Promise.all(days.map(readDay)),
  openSettings: () => openHealthConnectSettings(),
};
