import { buildWidgetSnapshot, type WidgetSnapshot } from "@untitled/logic";
import type { ListResponse, JournalEntry, Task } from "@untitled/types";

import { api } from "@/lib/api";
import { isoDate, timeOf } from "@/lib/dates";

type HealthDay = { day: string; steps: number | null; distance_m: number | null; active_kcal: number | null; sleep_minutes: number | null };

/** Rows asked for: enough for the streak and the day's list without pulling the whole history. */
const TASK_LIMIT = 200;
const JOURNAL_LIMIT = 200;

/**
 * Reads what the widgets need from the API, all three at once, and builds the snapshot. A part that fails (offline, a server hiccup)
 * falls back to what the previous snapshot had, so one bad request never blanks a widget.
 */
export async function loadWidgetSnapshot(previous: WidgetSnapshot | null): Promise<WidgetSnapshot> {
  const today = isoDate();
  const [tasks, journal, health] = await Promise.allSettled([
    api.get<ListResponse<Task>>(`/api/v1/tasks?done=false&archived=false&cancelled=false&limit=${TASK_LIMIT}`),
    api.get<ListResponse<JournalEntry>>(`/api/v1/journal?limit=${JOURNAL_LIMIT}`),
    api.get<{ data: HealthDay[] }>("/api/v1/health?days=1"),
  ]);

  const built = buildWidgetSnapshot({
    today,
    now: new Date().toISOString(),
    tasks: tasks.status === "fulfilled" ? tasks.value.data : [],
    entries: journal.status === "fulfilled" ? journal.value.data : [],
    health: health.status === "fulfilled" ? (health.value.data.find((d) => d.day === today) ?? null) : null,
    time: timeOf,
  });

  // Keep the old figures for any part that could not be read this time.
  if (previous && previous.day === today) {
    if (tasks.status === "rejected") built.tasks = previous.tasks;
    if (journal.status === "rejected") built.journal = previous.journal;
    if (health.status === "rejected") built.health = previous.health;
  }
  return built;
}
