import "server-only";
import type { userDb } from "../db/builders";

type Db = ReturnType<typeof userDb>;

export async function createTask(
  db: Db,
  input: { title: string; description: string; due_date: string | null; recurrence?: string | null },
) {
  const { data, error } = await db.from("tasks").insert(input).select("id").single();
  if (error || !data) throw new Error("Could not create to-do");
  return data as { id: string };
}
