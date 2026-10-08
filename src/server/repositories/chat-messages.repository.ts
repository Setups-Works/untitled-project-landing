import "server-only";
import type { userDb } from "../db/builders";

type Db = ReturnType<typeof userDb>;

export async function getMessageBody(db: Db, id: string) {
  const { data, error } = await db.from("chat_messages").select("role,body").eq("id", id).single();
  if (error || !data) return null;
  const row = data as { role: string; body: string };
  return row.role === "assistant" ? row.body : null;
}

export async function replaceMessageBody(db: Db, id: string, body: string) {
  const { error } = await db.from("chat_messages").update({ body }).eq("id", id);
  if (error) throw new Error("Could not update chat message");
}
