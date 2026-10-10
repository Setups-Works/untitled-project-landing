import type { Task } from "../../lib/workspace";

export type CalendarViewMode = "month" | "week" | "day" | "agenda";

export const CALENDAR_VIEWS: { id: CalendarViewMode; label: string }[] = [
  { id: "month", label: "Month" },
  { id: "week", label: "Week" },
  { id: "day", label: "Day" },
  { id: "agenda", label: "Agenda" },
];

export type CalendarTone = "violet" | "blue" | "green" | "amber" | "clay" | "mint" | "gold" | "sand";

export const CALENDAR_TONES: CalendarTone[] = ["blue", "violet", "green", "amber", "clay", "mint", "gold", "sand"];

export type CalendarEventItem = {
  id: string;
  external_id: string | null;
  calendar_id: string;
  title: string;
  description: string;
  location: string;
  start_at: string;
  end_at: string;
  all_day: boolean;
  color: CalendarTone | string;
  created_at: string;
  updated_at: string;
};

export type EventDraft = {
  title: string;
  description: string;
  location: string;
  start_date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_date: string; // YYYY-MM-DD
  end_time: string; // HH:mm
  all_day: boolean;
  color: CalendarTone | string;
};

export type CalendarTaskItem = Task;
