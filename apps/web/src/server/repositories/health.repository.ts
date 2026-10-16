import "server-only";
import type { userDb } from "../db/builders";

type Db = ReturnType<typeof userDb>;

export const HEALTH_COLUMNS = "day,steps,distance_m,active_kcal,resting_hr,hr_min,hr_max,sleep_minutes,source,synced_at";

export type HealthRow = {
  day: string;
  steps: number | null;
  distance_m: number | null;
  active_kcal: number | null;
  resting_hr: number | null;
  hr_min: number | null;
  hr_max: number | null;
  sleep_minutes: number | null;
  source: "healthkit" | "health_connect" | "unknown";
  synced_at: string;
};

export async function listHealthDays(db: Db, since: string, limit: number) {
  const { data, error } = await db
    .from<HealthRow>("health_daily")
    .select(HEALTH_COLUMNS)
    .gte("day", since)
    .order("day", { ascending: false })
    .limit(limit);
  if (error) throw new Error("Could not load health data");
  return data ?? [];
}

export async function upsertHealthDays(db: Db, rows: Record<string, unknown>[]) {
  const { error } = await db.from("health_daily").upsert(rows, { onConflict: "user_id,day" });
  if (error) throw new Error("Could not save health data");
}
