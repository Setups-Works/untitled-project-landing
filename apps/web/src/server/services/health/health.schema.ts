import { z } from "zod";

/** A reading outside the possible range (a phone reports 0 for "no heart rate") is stored as no data, so one bad value can't reject the day. */
const metric = (min: number, max: number) => z.number().int().min(min).max(max).nullable().optional().catch(null);

export const healthDayInput = z.object({
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  steps: metric(0, 200_000),
  distance_m: metric(0, 500_000),
  active_kcal: metric(0, 20_000),
  resting_hr: metric(20, 250),
  hr_min: metric(20, 250),
  hr_max: metric(20, 250),
  sleep_minutes: metric(0, 1440),
});

/** A phone sends the last few days at once; capped so one request can't write the whole history. */
export const healthSyncInput = z.object({
  source: z.enum(["healthkit", "health_connect"]),
  days: z.array(healthDayInput).min(1).max(60),
});

export type HealthSyncInput = z.infer<typeof healthSyncInput>;
