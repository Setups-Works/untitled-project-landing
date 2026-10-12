import { useSyncExternalStore } from "react";

export type SettingsPrefs = {
  timeFormat: "12h" | "24h";
  defaultCategory: string;
  weekStart: "mon" | "sun";
  density: "comfortable" | "compact";
  reduceMotion: boolean;
  todoView: "today" | "inbox" | "upcoming";
};

export const DEFAULT_SETTINGS_PREFS: SettingsPrefs = {
  timeFormat: "12h",
  defaultCategory: "Others",
  weekStart: "mon",
  density: "comfortable",
  reduceMotion: false,
  todoView: "today",
};

export const NOTE_CATEGORIES = ["Others", "Ideas & Creativity", "Personal", "Work", "Learning", "Health"] as const;

export function cleanSettingsPrefs(value: unknown): SettingsPrefs {
  const raw = value && typeof value === "object" ? (value as Partial<SettingsPrefs>) : {};
  return {
    timeFormat: raw.timeFormat === "24h" ? "24h" : "12h",
    defaultCategory:
      typeof raw.defaultCategory === "string" && NOTE_CATEGORIES.includes(raw.defaultCategory as (typeof NOTE_CATEGORIES)[number])
        ? raw.defaultCategory
        : DEFAULT_SETTINGS_PREFS.defaultCategory,
    weekStart: raw.weekStart === "sun" ? "sun" : "mon",
    density: raw.density === "compact" ? "compact" : "comfortable",
    reduceMotion: raw.reduceMotion === true,
    todoView: raw.todoView === "inbox" || raw.todoView === "upcoming" ? raw.todoView : "today",
  };
}

let runtimePrefs = DEFAULT_SETTINGS_PREFS;
const listeners = new Set<() => void>();

/** Sync mirror for plain date helpers that cannot read React context. */
export function updateRuntimePrefs(prefs: SettingsPrefs) {
  runtimePrefs = prefs;
  listeners.forEach((listener) => listener());
}

export function getRuntimePrefs() {
  return runtimePrefs;
}
export function useRuntimePrefs() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getRuntimePrefs,
    () => DEFAULT_SETTINGS_PREFS,
  );
}
