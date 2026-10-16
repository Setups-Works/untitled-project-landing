import "server-only";
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
 * The last week as one delimited text block for the chat model, or "" when nothing has been synced (the prompt then tells the
 * assistant to point the person at the Health page). Only validated integers go in, so nothing here can carry an instruction.
 */
export async function healthContextFor(userId: string): Promise<string> {
  const days = await getHealth(userId, 7).catch(() => []);
  if (!days.length) return "";
  const part = (label: string, v: number | null, unit: string) => (v === null ? "" : ` ${label} ${v}${unit}`);
  const lines = days.map((d) => {
    const hr = d.hr_min !== null && d.hr_max !== null ? ` heart rate ${d.hr_min}-${d.hr_max} bpm` : "";
    return `${d.day}:${part("steps", d.steps, "")}${part("distance", d.distance_m, " m")}${part("active energy", d.active_kcal, " kcal")}${part("resting heart rate", d.resting_hr, " bpm")}${hr}${part("sleep", d.sleep_minutes, " min")}`;
  });
  return `<health-data source="${days[0].source}">\n${lines.join("\n")}\n</health-data>`;
}

/** Store what the phone read. Days are replaced, so the latest sync of a day wins (the day is still filling up). */
export async function syncHealth(userId: string, input: HealthSyncInput) {
  const syncedAt = new Date().toISOString();
  const rows = input.days.map((d) => ({
    day: d.day,
    steps: d.steps ?? null,
    distance_m: d.distance_m ?? null,
    active_kcal: d.active_kcal ?? null,
    resting_hr: d.resting_hr ?? null,
    hr_min: d.hr_min ?? null,
    hr_max: d.hr_max ?? null,
    sleep_minutes: d.sleep_minutes ?? null,
    source: input.source,
    synced_at: syncedAt,
  }));
  await upsertHealthDays(userDb(userId), rows);
  return { saved: rows.length };
}
