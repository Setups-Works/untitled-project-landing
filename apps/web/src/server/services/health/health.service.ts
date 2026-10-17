import "server-only";
import { addDays } from "@untitled/logic/dates";
import { userDb } from "../../db/builders";
import { listHealthDays, upsertHealthDays } from "../../repositories/health.repository";
import type { HealthSyncInput } from "./health.schema";

/** Newest first. `days` is how far back to look (1–90). */
export async function getHealth(userId: string, days: number) {
  const span = Math.min(Math.max(Math.floor(days) || 14, 1), 90);
  const since = new Date(Date.now() - span * 86_400_000).toISOString().slice(0, 10);
  return listHealthDays(userDb(userId), since, span + 1);
}

/**
 * The last 30 days as one delimited text block for the chat model, or "" when nothing has been synced (the prompt then tells the
 * assistant to point the person at the Health page). Days are labelled today / yesterday from the person's own calendar date, so
 * "how was yesterday?" maps to a line. Only validated integers go in, so nothing here can carry an instruction.
 */
export async function healthContextFor(userId: string, localDate: string): Promise<string> {
  const days = await getHealth(userId, 30).catch(() => []);
  if (!days.length) return "";
  const yesterday = addDays(localDate, -1);
  const label = (day: string) => (day === localDate ? `${day} (today)` : day === yesterday ? `${day} (yesterday)` : day);
  // Every figure is listed, and a missing one says so: left out, the model fills the gap with 0, which reads as "measured nothing".
  const fig = (name: string, value: string | null) => `${name} ${value ?? "not recorded"}`;
  const num = (v: number | null, unit: string) => (v === null ? null : `${v}${unit}`);
  const lines = days.map((d) => {
    const heart = d.hr_min !== null && d.hr_max !== null ? `${d.hr_min}-${d.hr_max} bpm` : null;
    const parts = [
      fig("steps", num(d.steps, "")),
      fig("distance", num(d.distance_m, " m")),
      fig("active energy", num(d.active_kcal, " kcal")),
      fig("heart rate", heart),
      fig("resting heart rate", num(d.resting_hr, " bpm")),
      fig("sleep", num(d.sleep_minutes, " min")),
    ];
    return `${label(d.day)}: ${parts.join(", ")}`;
  });
  return `<health-data source="${days[0].source}">\n${lines.join("\n")}\n</health-data>`;
}

/**
 * Store what the phone read. A day is replaced by its latest reading (the day is still filling up), but a metric the phone sent no
 * value for keeps what was stored: "no reading right now" must not erase a number an earlier sync or another phone recorded.
 */
export async function syncHealth(userId: string, input: HealthSyncInput) {
  const db = userDb(userId);
  const syncedAt = new Date().toISOString();
  const oldest = input.days.reduce((min, d) => (d.day < min ? d.day : min), input.days[0]!.day);
  const stored = new Map((await listHealthDays(db, oldest, input.days.length + 1)).map((r) => [r.day, r]));
  const rows = input.days.map((d) => {
    const old = stored.get(d.day);
    return {
      day: d.day,
      steps: d.steps ?? old?.steps ?? null,
      distance_m: d.distance_m ?? old?.distance_m ?? null,
      active_kcal: d.active_kcal ?? old?.active_kcal ?? null,
      resting_hr: d.resting_hr ?? old?.resting_hr ?? null,
      hr_min: d.hr_min ?? old?.hr_min ?? null,
      hr_max: d.hr_max ?? old?.hr_max ?? null,
      sleep_minutes: d.sleep_minutes ?? old?.sleep_minutes ?? null,
      source: input.source,
      synced_at: syncedAt,
    };
  });
  await upsertHealthDays(db, rows);
  return { saved: rows.length };
}
