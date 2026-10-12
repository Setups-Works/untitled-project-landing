/**
 * Row and response shapes of the REST API (/api/v1/notes, /tasks, /journal). They mirror the Zod row schemas in
 * apps/web/src/lib/api/resources.ts, which stay the source of truth: change them together.
 */
export type Tone = "violet" | "blue" | "green" | "amber" | "clay" | "sand" | "mint" | "gold";

export type Attachment = { path: string; name: string; type: string; size: number };

export type Task = {
  id: string;
  title: string;
  description: string;
  /** 1 (urgent) to 4 (none). */
  priority: 1 | 2 | 3 | 4;
  list_id: string | null;
  /** YYYY-MM-DD */
  due_date: string | null;
  done: boolean;
  done_at: string | null;
  cancelled: boolean;
  archived: boolean;
  recurrence: string | null;
  created_at: string;
};

export type Note = {
  id: string;
  title: string;
  body: string;
  category: string;
  pinned: boolean;
  kind: "text" | "voice";
  sort_order: number;
  color: Tone | null;
  attachments: Attachment[];
  created_at: string;
  updated_at: string;
};

export type JournalEntry = {
  id: string;
  /** YYYY-MM-DD */
  entry_date: string;
  body: string;
  kind: "text" | "voice";
  attachments: Attachment[];
  created_at: string;
  updated_at: string;
};

export type ListResponse<T> = { data: T[]; limit: number; offset: number };
export type ItemResponse<T> = { data: T };

export type TaskList = { id: string; name: string; color: string; created_at: string };
