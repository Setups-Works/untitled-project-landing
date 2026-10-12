import { accountInfo, currentUser } from "../../../../../server/session";
import { json, unauthorized } from "../../../../../server/http";
import { userDb } from "../../../../../server/db/builders";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Mobile settings bootstrap: account facts plus the caller's own profile preferences. */
export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();
  const [account, profile] = await Promise.all([
    accountInfo(user.id),
    userDb(user.id).from("profiles").select("preferences").maybeSingle(),
  ]);
  if (profile.error) return json({ error: "Couldn’t load your settings." }, 500);
  return json({
    data: {
      ...user,
      ...account,
      hasPassword: account.providers.includes("email"),
      preferences: profile.data?.preferences ?? {},
    },
  });
}
