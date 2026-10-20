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

/** Sets or clears an entry's public link token. Runs as the user, so only the owner's own entry is found. Returns the new token (or null). */
export async function setJournalShareToken(db: Db, id: string, token: string | null) {
  const { data, error } = await db
    .from("journal_entries")
    .update({ share_token: token, shared_at: token ? new Date().toISOString() : null })
    .eq("id", id)
    .select("share_token")
    .maybeSingle();
  if (error) throw new Error("Could not change journal sharing");
  return data ? { share_token: (data as { share_token: string | null }).share_token } : null;
}

export type SharedEntryRow = {
  id: string;
  user_id: string;
  entry_date: string;
  body: string;
  kind: "text" | "voice";
  attachments: { path: string; name: string; type: string; size: number }[];
  created_at: string;
  shared_at: string | null;
};

/** The entry behind a public link, found by exact token. Takes the owner-level handle the service chose; never exposes lists. */
export async function findSharedEntry(db: Db, token: string) {
  const { data } = await db
    .from<SharedEntryRow>("journal_entries")
    .select("id,user_id,entry_date,body,kind,attachments,created_at,shared_at")
    .eq("share_token", token)
    .maybeSingle();
  return (data as SharedEntryRow | null) ?? null;
}
