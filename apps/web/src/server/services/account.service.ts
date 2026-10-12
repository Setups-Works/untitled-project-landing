import "server-only";
import { isRootAdmin } from "../session";
import { userDb } from "../db/builders";
import { pool } from "../db/pool";
import { purgePrefix } from "../storage";

type Result = { ok: true } | { ok: false; error: string };

/** Clear the signed-in user's content through their RLS-scoped client, then remove private files. */
export async function resetUserWorkspace(userId: string): Promise<Result> {
  const db = userDb(userId);
  const deletes = [
    await db.from("tasks").delete().not("id", "is", null),
    await db.from("task_lists").delete().not("id", "is", null),
    await db.from("notes").delete().not("id", "is", null),
    await db.from("journal_entries").delete().not("id", "is", null),
    await db.from("chats").delete().not("id", "is", null),
  ];
  if (deletes.some((result) => result.error)) return { ok: false, error: "Some items couldn’t be deleted. Please try again." };
  try {
    await purgePrefix("note-files", `${userId}/`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Your content was deleted, but some files couldn’t be removed." };
  }
}

/** Permanently delete a verified user's account, storage objects and database rows. */
export async function deleteUserAccount(user: { id: string; email: string }, confirmEmail: string): Promise<Result> {
  if (confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()) return { ok: false, error: "That email doesn’t match your account." };
  if (isRootAdmin(user.email)) return { ok: false, error: "This account is protected from deletion." };
  try {
    await purgePrefix("note-files", `${user.id}/`);
    await purgePrefix("avatars", `${user.id}/`);
    await pool().query("delete from auth.users where id = $1", [user.id]);
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
