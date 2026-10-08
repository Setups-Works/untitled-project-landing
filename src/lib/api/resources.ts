import { z } from "zod";

/**
 * The three main kinds of item, as REST resources: /api/v1/notes, /api/v1/tasks and /api/v1/journal.
 * One definition drives the route handlers (validation, columns, ordering) and the OpenAPI description, so they cannot disagree.
 * Privacy is enforced by the database (row-level security): every call runs as the signed-in user.
 */
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const attachment = z.object({ path: z.string(), name: z.string(), type: z.string(), size: z.number() });
const tone = z.enum(["violet", "blue", "green", "amber", "clay", "sand", "mint", "gold"]);
const recurrence = z.string().regex(/^(daily|weekdays|weekly|biweekly|monthly|yearly|nth:([1-4]|last):(sun|mon|tue|wed|thu|fri|sat))$/);

export type ResourceDef = {
  key: "notes" | "tasks" | "journal";
  path: string;
  table: string;
  tag: string;
  singular: string;
  columns: string;
  /** Sort order of the list, newest or most relevant first. */
  order: { column: string; ascending: boolean }[];
  /** Query parameters the list accepts besides limit and offset (each filters by equality on that column). */
  filters: Record<string, "boolean" | "string" | "date">;
  row: z.ZodObject;
  create: z.ZodObject;
  update: z.ZodObject;
};

const noteRow = z.object({
  id: z.string().uuid(),
  title: z.string(),
  body: z.string(),
  category: z.string(),
  pinned: z.boolean(),
  kind: z.enum(["text", "voice"]),
  sort_order: z.number(),
  color: tone.nullable(),
  attachments: z.array(attachment),
  created_at: z.string(),
  updated_at: z.string(),
});
const noteCreate = z.object({
  title: z.string().max(200).default(""),
  body: z.string().max(100_000).default(""),
  category: z.string().max(60).optional(),
  pinned: z.boolean().optional(),
  color: tone.nullable().optional(),
});

const taskRow = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  priority: z.number().int().min(1).max(4),
  list_id: z.string().uuid().nullable(),
  due_date: date.nullable(),
  done: z.boolean(),
  done_at: z.string().nullable(),
  cancelled: z.boolean(),
  archived: z.boolean(),
  recurrence: recurrence.nullable(),
  created_at: z.string(),
});
const taskCreate = z.object({
  title: z.string().trim().min(1).max(300),
  description: z.string().max(5000).default(""),
  priority: z.number().int().min(1).max(4).optional(),
  list_id: z.string().uuid().nullable().optional(),
  due_date: date.nullable().optional(),
  recurrence: recurrence.nullable().optional(),
});

const journalRow = z.object({
  id: z.string().uuid(),
  entry_date: date,
  body: z.string(),
  kind: z.enum(["text", "voice"]),
  attachments: z.array(attachment),
  created_at: z.string(),
  updated_at: z.string(),
});
const journalCreate = z.object({ entry_date: date, body: z.string().max(50_000).default("") });

export const RESOURCES: ResourceDef[] = [
  {
    key: "notes",
    path: "/api/v1/notes",
    table: "notes",
    tag: "Notes",
    singular: "note",
    columns: "id,title,body,category,pinned,kind,sort_order,color,attachments,created_at,updated_at",
    order: [{ column: "updated_at", ascending: false }],
    filters: { pinned: "boolean", category: "string" },
    row: noteRow,
    create: noteCreate,
    update: noteCreate.partial().extend({ sort_order: z.number().optional() }),
  },
  {
    key: "tasks",
    path: "/api/v1/tasks",
    table: "tasks",
    tag: "To-do",
    singular: "to-do",
    columns: "id,title,description,priority,list_id,due_date,done,done_at,cancelled,archived,recurrence,created_at",
    order: [{ column: "created_at", ascending: true }],
    filters: { done: "boolean", archived: "boolean", cancelled: "boolean", due_date: "date", list_id: "string" },
    row: taskRow,
    create: taskCreate,
    update: taskCreate.partial().extend({
      done: z.boolean().optional(),
      done_at: z.string().nullable().optional(),
      cancelled: z.boolean().optional(),
      archived: z.boolean().optional(),
    }),
  },
  {
    key: "journal",
    path: "/api/v1/journal",
    table: "journal_entries",
    tag: "Journal",
    singular: "journal entry",
    columns: "id,entry_date,body,kind,attachments,created_at,updated_at",
    order: [
      { column: "entry_date", ascending: false },
      { column: "created_at", ascending: false },
    ],
    filters: { entry_date: "date" },
    row: journalRow,
    create: journalCreate,
    update: z.object({ body: z.string().max(50_000).optional(), entry_date: date.optional() }),
  },
];
