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

/** The next occurrence of a recurring task, strictly after `after` (default today). */
export function nextDue(due: string, rule: string, after = isoDate()): string {
  let cur = due;
  for (let i = 0; i < 800; i++) {
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
