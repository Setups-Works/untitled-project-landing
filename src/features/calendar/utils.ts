import { addDays, isoDate } from "../../lib/dates";
import { readPrefs } from "../../lib/prefs";
import type { Task } from "../../lib/workspace";
import type { CalendarEventItem, CalendarTone, EventDraft } from "./types";
import { CALENDAR_TONES } from "./types";

/** Pixels per hour in the week and day grids. */
export const HOUR_PX = 56;
const MAX_SPAN_DAYS = 366;
/** How many days the agenda lists, and how far its arrows move. */
export const AGENDA_DAYS = 28;

/** Unknown or legacy colours fall back to blue so a chip is never left unstyled. */
export const toneOf = (color: string): CalendarTone => ((CALENDAR_TONES as string[]).includes(color) ? (color as CalendarTone) : "blue");

const pad = (n: number) => String(n).padStart(2, "0");
export const hhmm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** "09:00" → "9am" / "09:00" following the user's 12h/24h preference. */
export function timeLabel(hhmmValue: string, short = false) {
  const [h, m] = hhmmValue.split(":").map(Number);
  if (readPrefs().timeFormat === "24h") return `${pad(h)}:${pad(m)}`;
  const hour = h % 12 === 0 ? 12 : h % 12;
  const suffix = h < 12 ? "am" : "pm";
  return short && m === 0 ? `${hour}${suffix}` : `${hour}:${pad(m)}${suffix}`;
}

/** Every 15 minutes of the day, for the time pickers. */
export const TIME_OPTIONS = Array.from({ length: 96 }, (_, i) => `${pad(Math.floor(i / 4))}:${pad((i % 4) * 15)}`);

/** The local calendar days an event touches. A timed event ending exactly at midnight does not spill into the next day. */
export function eventDays(ev: Pick<CalendarEventItem, "start_at" | "end_at">): string[] {
  const start = new Date(ev.start_at);
  const end = new Date(ev.end_at);
  const last = isoDate(end.getTime() > start.getTime() ? new Date(end.getTime() - 1) : end);
  const days: string[] = [];
  let iso = isoDate(start);
  while (iso <= last && days.length < MAX_SPAN_DAYS) {
    days.push(iso);
    iso = addDays(iso, 1);
  }
  return days;
}

/** Events keyed by day (multi-day events appear on each day), earliest first with all-day events on top. */
export function groupEventsByDay(events: CalendarEventItem[]) {
  const map = new Map<string, CalendarEventItem[]>();
  for (const ev of events) {
    for (const iso of eventDays(ev)) map.set(iso, [...(map.get(iso) ?? []), ev]);
  }
  for (const list of map.values()) {
    list.sort((a, b) => Number(b.all_day) - Number(a.all_day) || a.start_at.localeCompare(b.start_at));
  }
  return map;
}

/** Open and finished tasks with a due date, keyed by that date. Cancelled and archived tasks are left out. */
export function groupTasksByDay(tasks: Task[]) {
  const map = new Map<string, Task[]>();
  for (const t of tasks) {
    if (!t.due_date || t.cancelled || t.archived) continue;
    map.set(t.due_date, [...(map.get(t.due_date) ?? []), t]);
  }
  return map;
}

export type Placed = { ev: CalendarEventItem; top: number; height: number; col: number; cols: number };

/**
 * Positions the timed events of one day. Overlapping events share the width: each cluster of overlaps is split into as many
 * columns as it needs, so two meetings at the same hour sit side by side instead of on top of each other.
 */
export function layoutDay(events: CalendarEventItem[], iso: string): Placed[] {
  const dayStart = new Date(`${iso}T00:00:00`).getTime();
  const items = events
    .filter((e) => !e.all_day)
    .map((ev) => {
      const s = Math.max(new Date(ev.start_at).getTime(), dayStart);
      const e = Math.min(new Date(ev.end_at).getTime(), dayStart + 86_400_000);
      const startMin = (s - dayStart) / 60_000;
      return { ev, startMin, endMin: Math.max(e - dayStart, s - dayStart + 30 * 60_000) / 60_000 };
    })
    .sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);

  const placed: Placed[] = [];
  let cluster: { item: (typeof items)[number]; col: number }[] = [];
  let clusterEnd = -1;
  const flush = () => {
    const cols = Math.max(1, ...cluster.map((c) => c.col + 1));
    for (const { item, col } of cluster) {
      placed.push({
        ev: item.ev,
        col,
        cols,
        top: (item.startMin / 60) * HOUR_PX,
        height: Math.max(24, ((item.endMin - item.startMin) / 60) * HOUR_PX - 2),
      });
    }
    cluster = [];
  };
  const colEnds: number[] = [];
  for (const item of items) {
    if (cluster.length && item.startMin >= clusterEnd) {
      flush();
      colEnds.length = 0;
    }
    let col = colEnds.findIndex((end) => end <= item.startMin);
    if (col === -1) col = colEnds.length;
    colEnds[col] = item.endMin;
    cluster.push({ item, col });
    clusterEnd = Math.max(clusterEnd, item.endMin);
  }
  if (cluster.length) flush();
  return placed;
}

/** Form values → the stored row. All-day events run from the start of the first day to the end of the last. */
export function draftToRow(d: EventDraft) {
  const start = d.all_day ? new Date(`${d.start_date}T00:00:00`) : new Date(`${d.start_date}T${d.start_time || "09:00"}:00`);
  const end = d.all_day ? new Date(`${d.end_date}T23:59:59`) : new Date(`${d.end_date}T${d.end_time || "10:00"}:00`);
  return {
    title: d.title.trim(),
    description: d.description.trim(),
    location: d.location.trim(),
    start_at: start.toISOString(),
    end_at: end.toISOString(),
    all_day: d.all_day,
    color: d.color,
  };
}

/** A stored event → form values. */
export function eventToDraft(ev: CalendarEventItem): EventDraft {
  const s = new Date(ev.start_at);
  const e = new Date(ev.end_at);
  return {
    title: ev.title,
    description: ev.description,
    location: ev.location,
    start_date: isoDate(s),
    start_time: hhmm(s),
    end_date: isoDate(e),
    end_time: hhmm(e),
    all_day: ev.all_day,
    color: toneOf(ev.color),
  };
}

/** A blank form for a new event starting at `time` on `date`, lasting an hour. */
export function newDraft(date: string, time = "09:00"): EventDraft {
  const [h, m] = time.split(":").map(Number);
  const endH = h + 1;
  return {
    title: "",
    description: "",
    location: "",
    start_date: date,
    start_time: time,
    end_date: endH > 23 ? addDays(date, 1) : date,
    end_time: `${pad(endH % 24)}:${pad(m)}`,
    all_day: false,
    color: "blue",
  };
}

/** The visible range for a view, so navigation steps and titles agree. */
export function shiftDate(d: Date, mode: "month" | "week" | "day" | "agenda", dir: 1 | -1) {
  const next = new Date(d);
  if (mode === "month") next.setMonth(next.getMonth() + dir, 1);
  else next.setDate(next.getDate() + dir * (mode === "week" ? 7 : mode === "day" ? 1 : AGENDA_DAYS));
  return next;
}

/** The heading for the visible period. */
export function titleFor(d: Date, mode: "month" | "week" | "day" | "agenda", weekStart: "mon" | "sun") {
  if (mode === "month") return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  if (mode === "day") return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  if (mode === "agenda") return "Coming up";
  const first = weekDays(d, weekStart)[0];
  const last = weekDays(d, weekStart)[6];
  const sameMonth = first.getMonth() === last.getMonth();
  const a = first.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const b = last.toLocaleDateString(undefined, sameMonth ? { day: "numeric" } : { month: "short", day: "numeric" });
  return `${a} – ${b}, ${last.getFullYear()}`;
}

/** The seven days of the week containing `d`, starting on the user's first day. */
export function weekDays(d: Date, weekStart: "mon" | "sun") {
  const offset = (d.getDay() - (weekStart === "sun" ? 0 : 1) + 7) % 7;
  return Array.from({ length: 7 }, (_, i) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - offset + i));
}

/** The 6-week grid for a month (always 42 cells so the card never changes height). */
export function monthCells(d: Date, weekStart: "mon" | "sun") {
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const offset = (first.getDay() - (weekStart === "sun" ? 0 : 1) + 7) % 7;
  return Array.from({ length: 42 }, (_, i) => new Date(d.getFullYear(), d.getMonth(), 1 - offset + i));
}
