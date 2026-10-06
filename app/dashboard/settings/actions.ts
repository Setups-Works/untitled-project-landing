"use server";
import { currentUser, isRootAdmin, serviceConfigured, supabaseAdmin } from "../../../lib/supabase/admin";

type Result = { ok: true } | { ok: false; error: string };

/** Permanently deletes the signed-in user's account, their files and (via cascade) all their rows. */
export async function deleteMyAccount(confirmEmail: string): Promise<Result> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "You’re not signed in." };
  if (typeof confirmEmail !== "string" || confirmEmail.trim().toLowerCase() !== (user.email ?? "").toLowerCase())
    return { ok: false, error: "That email doesn’t match your account." };
  if (isRootAdmin(user.email)) return { ok: false, error: "This account is listed in ADMIN_EMAILS. Remove it from there first." };
  if (!serviceConfigured) return { ok: false, error: "Account deletion isn’t available until SUPABASE_SERVICE_ROLE_KEY is set." };

  try {
    const sb = supabaseAdmin();
    // Files live at note-files/<user id>/<note id>/<file>; remove them before the account goes.
    const bucket = sb.storage.from("note-files");
    const { data: folders } = await bucket.list(user.id, { limit: 1000 });
    for (const f of folders ?? []) {
      const { data: files } = await bucket.list(`${user.id}/${f.name}`, { limit: 1000 });
      if (files?.length) await bucket.remove(files.map((x) => `${user.id}/${f.name}/${x.name}`));
    }
    const { error } = await sb.auth.admin.deleteUser(user.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
