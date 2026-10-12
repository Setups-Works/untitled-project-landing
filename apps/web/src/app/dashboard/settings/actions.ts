"use server";
import { pool } from "../../../server/db/pool";
import { currentUser, isRootAdmin, serverConfigured } from "../../../server/session";
import { purgePrefix } from "../../../server/storage";

type Result = { ok: true } | { ok: false; error: string };

/** Permanently deletes the signed-in user's account, their files and (via cascade) all their rows. */
export async function deleteMyAccount(confirmEmail: string): Promise<Result> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "You’re not signed in." };
  if (typeof confirmEmail !== "string" || confirmEmail.trim().toLowerCase() !== user.email.toLowerCase())
    return { ok: false, error: "That email doesn’t match your account." };
  if (isRootAdmin(user.email)) return { ok: false, error: "This account is listed in ADMIN_EMAILS. Remove it from there first." };
  if (!serverConfigured()) return { ok: false, error: "Account deletion isn’t available until the server is configured." };

  try {
    // Files live under <user id>/… in each bucket; remove them before the account goes.
    await purgePrefix("note-files", `${user.id}/`);
    await purgePrefix("avatars", `${user.id}/`);
    // Every table references auth.users with ON DELETE CASCADE, so this removes the user's rows and sessions too.
    await pool().query("delete from auth.users where id = $1", [user.id]);
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
