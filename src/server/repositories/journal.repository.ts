import "server-only";
import type { userDb } from "../db/builders";

type Db = ReturnType<typeof userDb>;

export async function setJournalBody(db: Db, id: string, body: string) {
  const { error } = await db.from("journal_entries").update({ body }).eq("id", id);
  if (error) throw new Error("Could not update journal entry");
}

export async function createJournalEntry(db: Db, input: { body: string; entry_date: string }) {
  const { data, error } = await db.from("journal_entries").insert(input).select("id,entry_date").single();
  if (error || !data) throw new Error("Could not create journal entry");
  return data as { id: string; entry_date: string };
}
