import "server-only";
import type { userDb } from "../db/builders";

type Db = ReturnType<typeof userDb>;

export async function createNote(db: Db, input: { title: string; body: string }) {
  const { data, error } = await db.from("notes").insert({ ...input, category: "Others" }).select("id").single();
  if (error || !data) throw new Error("Could not create note");
  return data as { id: string };
}
