export type Prefs = {
  timeFormat: "12h" | "24h";
  defaultCategory: string;
  weekStart: "mon" | "sun";
  density: "comfortable" | "compact";
  reduceMotion: boolean;
  todoView: "today" | "inbox" | "upcoming";
};

export const DEFAULT_PREFS: Prefs = {
  timeFormat: "12h", defaultCategory: "Others", weekStart: "mon", density: "comfortable", reduceMotion: false, todoView: "today",
};
const KEY = "up_prefs";

/** Preferences live in the user's Supabase profile; a copy in localStorage lets plain helpers (like time formatting) read them. */
export function cleanPrefs(v: unknown, categories: readonly string[]): Prefs {
  const o = (v && typeof v === "object" ? v : {}) as Partial<Prefs>;
  return {
    timeFormat: o.timeFormat === "24h" ? "24h" : "12h",
    defaultCategory: typeof o.defaultCategory === "string" && categories.includes(o.defaultCategory) ? o.defaultCategory : DEFAULT_PREFS.defaultCategory,
    weekStart: o.weekStart === "sun" ? "sun" : "mon",
    density: o.density === "compact" ? "compact" : "comfortable",
    reduceMotion: o.reduceMotion === true,
    todoView: o.todoView === "inbox" || o.todoView === "upcoming" ? o.todoView : "today",
  };
}

export function readPrefs(): Prefs {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(KEY) : null;
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

/** Clock time of an ISO timestamp, in the user's 12h/24h preference. */
export function fmtTime(iso: string) {
  const d = new Date(iso);
  return readPrefs().timeFormat === "24h"
    ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })
    : d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();
}

/** Days from the start of the user's week to `date` (0–6). */
export const weekdayIndex = (date: Date, start: Prefs["weekStart"] = readPrefs().weekStart) =>
  (date.getDay() - (start === "sun" ? 0 : 1) + 7) % 7;

/** Seven one-letter or short weekday labels starting on the user's first day of the week. */
export function weekdayLabels(style: "narrow" | "short" = "narrow", start: Prefs["weekStart"] = readPrefs().weekStart) {
  const first = start === "sun" ? 0 : 1;
  return Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 7 + first + i).toLocaleDateString(undefined, { weekday: style }));
}

export function writePrefs(p: Prefs) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* storage unavailable — preferences still save to the account */
  }
}
