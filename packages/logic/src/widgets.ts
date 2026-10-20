import { HEALTH_GOALS, healthRatio, fmtDuration, fmtNumber } from "./health";

/**
 * What the home-screen widgets show, as one small plain object the app builds and hands to the phone's widgets (iOS WidgetKit and Android
 * App Widgets). Widgets never hold a login: the app writes this snapshot when it opens or comes back to the foreground, and the widgets
 * only draw it. Both platforms read the same snapshot, the same wording and the same limits, so they can't drift apart.
 */
export const WIDGET_LIMITS = {
  /** Tasks listed in a widget (small shows fewer; the widget decides). */
  taskItems: 8,
  /** Characters of the latest journal entry a widget keeps. */
  latestChars: 220,
  /** Entries and days looked at when working out the writing streak. */
  streakLookbackDays: 400,
} as const;

/** The widgets, by the name the platforms register them under. */
export const WIDGET_NAMES = { tasks: "TasksWidget", quick: "QuickWidget", health: "HealthWidget", journal: "JournalWidget" } as const;

/** In-app addresses a widget tap opens (the app's `untitled://` scheme). */
export const WIDGET_LINKS = {
  tasks: "untitled:///todo",
  health: "untitled:///health",
  journal: "untitled:///journal",
  newEntry: "untitled:///journal?new=1",
  newNote: "untitled:///note/new",
  newTask: "untitled:///task/new",
} as const;

/** Every word a widget shows, so the two platforms say the same things (and nothing is typed twice). */
export const WIDGET_TEXT = {
  signIn: "Open the app to sign in",
  tasksTitle: "Today",
  tasksEmpty: "All clear",
  overdue: "overdue",
  quickTitle: "Write",
  newEntry: "Journal",
  newNote: "Note",
  newTask: "Task",
  healthTitle: "Steps",
  stepsOf: "of",
  distance: "Distance",
  energy: "Active",
  sleep: "Sleep",
  healthEmpty: "Open Health in the app to sync",
  journalTitle: "Journal",
  journalEmpty: "Nothing written yet today",
  streakOne: "day streak",
  kcal: "kcal",
} as const;

export type WidgetText = typeof WIDGET_TEXT;

/** "3 day streak" style label; a streak of 0 is simply "Start today". */
export const streakLabel = (n: number) => (n > 0 ? `${n} ${WIDGET_TEXT.streakOne}` : "Start today");

/** Sizes and counts both platforms draw with: how many rows fit each widget size, type sizes, spacing and corner radius. */
export const WIDGET_LAYOUT = {
  /** Task rows by iOS widget family; Android works the rows out from the widget's height and `rowDp`. */
  rows: { systemSmall: 3, systemMedium: 4, systemLarge: 8 },
  /** Lines of the latest journal entry by iOS widget family. */
  lines: { systemSmall: 3, systemMedium: 4, systemLarge: 10 },
  type: { small: 12, body: 14, title: 16, big: 32 },
  gap: 8,
  pad: 14,
  radius: 22,
  /** Height of one list row on Android, and the room the header takes (both in dp). */
  rowDp: 24,
  headerDp: 56,
} as const;

export type WidgetLayout = typeof WIDGET_LAYOUT;

/** The colours a widget draws with, taken from the app's design tokens when the snapshot is pushed (a widget can't import the tokens itself). */
export type WidgetTone = { bg: string; fg: string };
export type WidgetTheme = {
  page: string;
  surface: string;
  fg: string;
  fgMuted: string;
  fgSubtle: string;
  accent: string;
  onAccent: string;
  tones: Record<keyof typeof WIDGET_NAMES, WidgetTone>;
};

/** Everything a widget needs to draw, in one object: iOS passes it as the widget's props, Android reads it from storage. */
export type WidgetProps = {
  snapshot: WidgetSnapshot;
  theme: WidgetTheme;
  text: WidgetText;
  links: typeof WIDGET_LINKS;
  layout: WidgetLayout;
};

export type WidgetTask = { id: string; title: string; overdue: boolean };

export type WidgetSnapshot = {
  /** False until someone is signed in on this phone; widgets then say "Open the app to sign in". */
  signedIn: boolean;
  /** The calendar day this snapshot is for (YYYY-MM-DD). */
  day: string;
  updatedAt: string;
  tasks: { open: number; dueToday: number; overdue: number; items: WidgetTask[] };
  journal: { streak: number; entriesToday: number; latest: { time: string; text: string } | null };
  health: {
    steps: number | null;
    stepsGoal: number;
    stepsRatio: number;
    distance: string | null;
    activeKcal: number | null;
    sleep: string | null;
  } | null;
};

export const emptyWidgetSnapshot = (day: string, signedIn = false): WidgetSnapshot => ({
  signedIn,
  day,
  updatedAt: "",
  tasks: { open: 0, dueToday: 0, overdue: 0, items: [] },
  journal: { streak: 0, entriesToday: 0, latest: null },
  health: null,
});

/** Days in a row, ending today (or yesterday, if nothing is written yet today), that have at least one entry. */
export function journalStreak(entryDates: string[], today: string): number {
  const days = new Set(entryDates);
  const back = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    const t = new Date(Date.UTC(y!, m! - 1, d! - 1));
    return t.toISOString().slice(0, 10);
  };
  let cursor = days.has(today) ? today : back(today);
  let n = 0;
  while (n < WIDGET_LIMITS.streakLookbackDays && days.has(cursor)) {
    n++;
    cursor = back(cursor);
  }
  return n;
}

type TaskIn = { id: string; title: string; due_date: string | null; done: boolean; cancelled?: boolean; archived?: boolean };
type EntryIn = { entry_date: string; body: string; created_at: string };
type HealthIn = { steps: number | null; distance_m: number | null; active_kcal: number | null; sleep_minutes: number | null } | null;

/** The text a widget shows for an entry: one line of plain text, cut to fit. */
export function widgetText(body: string, max: number = WIDGET_LIMITS.latestChars): string {
  const flat = body
    .replace(/[#>*_`~[\]()-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
}

/**
 * Builds the snapshot from what the app already knows. `time` formats an entry's timestamp the way the person set it (12 or 24 hour), so
 * the widget agrees with the app.
 */
export function buildWidgetSnapshot(input: {
  today: string;
  now: string;
  tasks: TaskIn[];
  entries: EntryIn[];
  health: HealthIn;
  time: (iso: string) => string;
}): WidgetSnapshot {
  const { today } = input;
  const open = input.tasks.filter((t) => !t.done && !t.cancelled && !t.archived);
  const overdue = open.filter((t) => t.due_date !== null && t.due_date < today);
  const dueToday = open.filter((t) => t.due_date === today);
  // Overdue first, then today's; undated tasks stay out of "today".
  const shown = [...overdue, ...dueToday]
    .slice(0, WIDGET_LIMITS.taskItems)
    .map((t) => ({ id: t.id, title: t.title, overdue: t.due_date !== null && t.due_date < today }));

  const todays = input.entries.filter((e) => e.entry_date === today).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const latest = todays[0] && todays[0].body.trim() ? { time: input.time(todays[0].created_at), text: widgetText(todays[0].body) } : null;

  const h = input.health;
  const health: WidgetSnapshot["health"] = h
    ? {
        steps: h.steps,
        stepsGoal: HEALTH_GOALS.steps,
        stepsRatio: h.steps === null ? 0 : healthRatio(h.steps, HEALTH_GOALS.steps),
        distance: h.distance_m === null ? null : h.distance_m >= 1000 ? `${(h.distance_m / 1000).toFixed(1)} km` : `${h.distance_m} m`,
        activeKcal: h.active_kcal,
        sleep: h.sleep_minutes === null ? null : fmtDuration(h.sleep_minutes),
      }
    : null;

  return {
    signedIn: true,
    day: today,
    updatedAt: input.now,
    tasks: { open: open.length, dueToday: dueToday.length, overdue: overdue.length, items: shown },
    journal: {
      streak: journalStreak(
        input.entries.map((e) => e.entry_date),
        today,
      ),
      entriesToday: todays.length,
      latest,
    },
    health,
  };
}

export { fmtNumber as widgetNumber };
