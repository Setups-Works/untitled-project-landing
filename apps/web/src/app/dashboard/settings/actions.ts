"use server";
import { currentUser, serverConfigured } from "../../../server/session";
import { deleteUserAccount } from "../../../server/services/account.service";

type Result = { ok: true } | { ok: false; error: string };

/** Permanently deletes the signed-in user's account, their files and (via cascade) all their rows. */
export async function deleteMyAccount(confirmEmail: string): Promise<Result> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "You’re not signed in." };
  if (typeof confirmEmail !== "string") return { ok: false, error: "That email doesn’t match your account." };
  if (!serverConfigured()) return { ok: false, error: "Account deletion isn’t available until the server is configured." };
  return deleteUserAccount(user, confirmEmail);
}
