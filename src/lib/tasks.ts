import type { Task, TaskList } from "./workspace";
import { dayLabel, isoDate } from "./dates";

export const PRIORITIES = [
  { p: 1, label: "Urgent" },
  { p: 2, label: "High" },
  { p: 3, label: "Medium" },
  { p: 4, label: "Low" },
] as const;

export const RECURRENCES: [string, string][] = [
  ["", "Doesn’t repeat"],
  ["daily", "Every day"],
  ["weekdays", "Every weekday"],
  ["weekly", "Every week"],
  ["monthly", "Every month"],
  ["yearly", "Every year"],
];

export const LIST_TONES = ["violet", "blue", "green", "amber", "clay", "mint", "gold", "sand"] as const;

export type Draft = {
  title: string;
  description: string;
  due_date: string | null;
  priority: 1 | 2 | 3 | 4;
  list_id: string | null;
  recurrence: string | null;
};
export const emptyDraft = (over: Partial<Draft> = {}): Draft => ({
  title: "",
  description: "",
  due_date: null,
  priority: 4,
  list_id: null,
  recurrence: null,
  ...over,
});

/** Which smart view / list is showing. */
export type ViewKey =
  "inbox" | "today" | "upcoming" | "filters" | "completed" | "cancelled" | "overdue" | "recurring" | "archived" | `list:${string}`;
export const SIMPLE_VIEWS = ["inbox", "today", "upcoming", "filters", "completed", "cancelled", "overdue", "recurring", "archived"];
export const isView = (v: string | null): v is ViewKey => !!v && (SIMPLE_VIEWS.includes(v) || /^list:[0-9a-f-]{36}$/i.test(v));

export const VIEW_TITLES: Record<string, string> = {
  inbox: "Inbox",
  today: "Today",
  upcoming: "Upcoming",
  filters: "Filters",
  completed: "Completed",
  cancelled: "Cancelled",
  overdue: "Overdue",
  recurring: "Recurring",
  archived: "Archived",
};

export type ViewOpts = {
  layout: "list" | "board" | "calendar";
  showCompleted: boolean;
  sortBy: "date" | "priority" | "name" | "created";
  dir: "asc" | "desc";
  groupBy: "none" | "date" | "priority" | "list";
  priority: 0 | 1 | 2 | 3 | 4; // 0 = all
};
export const DEFAULT_OPTS: ViewOpts = { layout: "list", showCompleted: false, sortBy: "date", dir: "asc", groupBy: "none", priority: 0 };

export const isOpen = (t: Task) => !t.done && !t.cancelled && !t.archived;
export const isOverdue = (t: Task, today: string) => isOpen(t) && !!t.due_date && t.due_date < today;

/** Tasks that belong in a view, before the user's sort/filter options. */
export function inView(t: Task, view: ViewKey, today: string, showCompleted: boolean): boolean {
  if (t.archived) return view === "archived";
  if (view === "archived") return false;
  if (t.cancelled) return view === "cancelled";
  const live = !t.done || showCompleted;
  switch (view) {
    case "inbox":
      return !t.list_id && live;
    case "today":
      return !!t.due_date && t.due_date <= today && (!t.done || (showCompleted && t.due_date === today));
    case "upcoming":
      return !t.done && !!t.due_date;
    case "overdue":
      return isOverdue(t, today);
    case "recurring":
      return !!t.recurrence && !t.done;
    case "completed":
      return t.done;
    case "cancelled":
      return false;
    case "filters":
      return false;
    default:
      return view.startsWith("list:") && t.list_id === view.slice(5) && live;
  }
}

const dateKey = (t: Task) => t.due_date ?? "9999-99-99";
const cmp: Record<ViewOpts["sortBy"], (a: Task, b: Task) => number> = {
  date: (a, b) => dateKey(a).localeCompare(dateKey(b)),
  priority: (a, b) => a.priority - b.priority,
  name: (a, b) => a.title.localeCompare(b.title),
  created: (a, b) => a.created_at.localeCompare(b.created_at),
};

export function applyOpts(tasks: Task[], o: ViewOpts): Task[] {
  const out = tasks.filter((t) => !o.priority || t.priority === o.priority);
  out.sort((a, b) => (cmp[o.sortBy](a, b) || a.created_at.localeCompare(b.created_at)) * (o.dir === "desc" ? -1 : 1));
  return out;
}

export type Group = { key: string; title: string; tone?: string; tasks: Task[]; date?: string };

export function groupTasks(tasks: Task[], by: ViewOpts["groupBy"], lists: TaskList[], today: string): Group[] {
  if (by === "none") return [{ key: "all", title: "", tasks }];
  const map = new Map<string, Group>();
  const put = (key: string, title: string, tone: string | undefined, t: Task, date?: string) => {
    if (!map.has(key)) map.set(key, { key, title, tone, tasks: [], date });
    map.get(key)!.tasks.push(t);
  };
  for (const t of tasks) {
    if (by === "date")
      put(
        t.due_date ?? "none",
        t.due_date ? dayLabel(t.due_date, today) : "No date",
        t.due_date ? (t.due_date < today ? "clay" : t.due_date === today ? "amber" : "mint") : "sand",
        t,
        t.due_date ?? undefined,
      );
    if (by === "priority") put(`p${t.priority}`, PRIORITIES[t.priority - 1].label, ["clay", "gold", "blue", "sand"][t.priority - 1], t);
    if (by === "list") {
      const l = lists.find((x) => x.id === t.list_id);
      put(l?.id ?? "inbox", l?.name ?? "Inbox", l?.color ?? "sand", t);
    }
  }
  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
}

function daysIn(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}

/* ---- "Every month on the 2nd Wednesday": rule `nth:<1-4>:<weekday>` ---- */
const DOW = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const DOW_NAME = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ORDINAL = ["", "1st", "2nd", "3rd", "4th"];
export const NTH_RULE = /^nth:([1-4]):(sun|mon|tue|wed|thu|fri|sat)$/;

const parts = (iso: string) => iso.split("-").map(Number) as [number, number, number];

/** The rule for "the same weekday of the month as this date" (the 2nd Wednesday, say); null for a 5th weekday, which not every month has. */
export function nthRuleFor(iso: string): string | null {
  const [y, m, d] = parts(iso);
  const n = Math.ceil(d / 7);
  return n > 4 ? null : `nth:${n}:${DOW[new Date(y, m - 1, d).getDay()]}`;
}

/** The date of the n-th weekday in a month (`month` is 0-based). */
function nthWeekday(year: number, month: number, n: number, dow: number): string {
  const first = new Date(year, month, 1).getDay();
  return isoDate(new Date(year, month, 1 + ((dow - first + 7) % 7) + (n - 1) * 7));
}

/** The first date strictly after `iso` that the rule lands on. */
function nextNth(iso: string, rule: string): string {
  const m = NTH_RULE.exec(rule);
  if (!m) return iso;
  const [n, dow] = [Number(m[1]), DOW.indexOf(m[2] as (typeof DOW)[number])];
  const [y, mo] = parts(iso);
  for (let i = 0; i < 3; i++) {
    const c = nthWeekday(y, mo - 1 + i, n, dow);
    if (c > iso) return c;
  }
  return iso;
}

/** "Every month on the 2nd Wednesday", or the plain label for the simple rules. */
export function recurrenceLabel(rule: string | null): string {
  if (!rule) return "Doesn’t repeat";
  const m = NTH_RULE.exec(rule);
  if (m) return `Every month on the ${ORDINAL[Number(m[1])]} ${DOW_NAME[DOW.indexOf(m[2] as (typeof DOW)[number])]}`;
  return RECURRENCES.find(([v]) => v === rule)?.[1] ?? rule;
}

/** The repeat choices for a form: the simple ones, "every month on the 2nd Wednesday" (from the due date), and the current rule if it is another one. */
export function recurrenceChoices(due: string | null, current: string | null): [string, string][] {
  const list = [...RECURRENCES];
  const nth = due ? nthRuleFor(due) : null;
  if (nth) list.push([nth, recurrenceLabel(nth)]);
  if (current && !list.some(([v]) => v === current)) list.push([current, recurrenceLabel(current)]);
  return list;
}

/**
 * The due date a repeating to-do should start on. Without a repeat it is the date given. With one, it is that date when it fits
 * the rule (or the first day on or after today when no date was given), otherwise the first date on or after `from` that does.
 * This is how "every second Wednesday" gets a real first date even when it was only described in words.
 */
export function firstDue(due: string | null, rule: string | null, from = isoDate()): string | null {
  if (!rule) return due;
  const start = due ?? from;
  if (!NTH_RULE.test(rule)) return due ?? from;
  const m = NTH_RULE.exec(rule)!;
  const [y, mo] = parts(start);
  const dow = DOW.indexOf(m[2] as (typeof DOW)[number]);
  for (let i = 0; i < 3; i++) {
    const c = nthWeekday(y, mo - 1 + i, Number(m[1]), dow);
    if (c >= start) return c;
  }
  return start;
}

/** The dates a repeating task will come back on after its own due date, up to and including `to` (used to show it on a calendar). */
export function upcomingDates(due: string, rule: string, to: string, max = 60): string[] {
  const out: string[] = [];
  let cur = due;
  while (out.length < max) {
    const next = nextDue(cur, rule, cur);
    if (next <= cur || next > to) break;
    out.push(next);
    cur = next;
  }
  return out;
}

/** The next occurrence of a recurring task, strictly after `after` (default today). */
export function nextDue(due: string, rule: string, after = isoDate()): string {
  let cur = due;
  for (let i = 0; i < 800; i++) {
    if (NTH_RULE.test(rule)) {
      cur = nextNth(cur, rule);
      if (cur > after) return cur;
      continue;
    }
    const [y, m, d] = cur.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    if (rule === "daily") dt.setDate(dt.getDate() + 1);
    else if (rule === "weekdays") {
      do dt.setDate(dt.getDate() + 1);
      while (dt.getDay() === 0 || dt.getDay() === 6);
    } else if (rule === "weekly") dt.setDate(dt.getDate() + 7);
    else if (rule === "monthly") {
      const first = new Date(y, m, 1); // first day of next month
      dt.setTime(new Date(first.getFullYear(), first.getMonth(), Math.min(d, daysIn(first.getFullYear(), first.getMonth()))).getTime());
    } else if (rule === "yearly") {
      dt.setTime(new Date(y + 1, m - 1, Math.min(d, daysIn(y + 1, m - 1))).getTime());
    } else return cur;
    cur = isoDate(dt);
    if (cur > after) return cur;
  }
  return cur;
}
