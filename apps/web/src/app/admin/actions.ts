"use server";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "../../server/auth";
import { pool } from "../../server/db/pool";
import { purgePrefix } from "../../server/storage";
import { adminDb, assertAdmin, audit, getUserById, isRootAdmin, type AdminUser, type AppUser } from "../../server/session";
import { EMAIL_RE } from "../../lib/validate";

type Result = { ok: true; message?: string } | { ok: false; error: string };
const UUID = /^[0-9a-f-]{36}$/i;

/** Loads the target user and refuses to touch yourself or an ADMIN_EMAILS account. */
type Guarded = { error: string; me?: undefined; user?: undefined } | { error?: undefined; me: AppUser; user: AdminUser };
async function guard(id: string, protect = true): Promise<Guarded> {
  const me = await assertAdmin();
  if (typeof id !== "string" || !UUID.test(id)) return { error: "Bad user id." };
  const user = await getUserById(id);
  if (!user) return { error: "User not found." };
  if (protect && user.id === me.id) return { error: "You can’t do that to your own account." };
  if (protect && isRootAdmin(user.email)) return { error: "This account is a protected admin (ADMIN_EMAILS)." };
  return { me, user };
}

async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

async function run(
  id: string,
  action: string,
  fn: (userId: string, email: string) => Promise<{ error: { message: string } | null } | void>,
  opts: { protect?: boolean; meta?: Record<string, unknown>; message?: string } = {},
): Promise<Result> {
  try {
    const g = await guard(id, opts.protect ?? true);
    if (g.error !== undefined) return { ok: false, error: g.error };
    const r = await fn(g.user.id, g.user.email);
    if (r && r.error) return { ok: false, error: r.error.message };
    await audit(g.me, action, g.user.email || id, opts.meta);
    revalidatePath("/admin", "layout");
    return { ok: true, message: opts.message };
  } catch {
    return { ok: false, error: "Not allowed." };
  }
}

export async function setAdminRole(id: string, makeAdmin: boolean) {
  return run(id, makeAdmin ? "user.make_admin" : "user.remove_admin", async (i) => {
    await auth.api.setRole({ body: { userId: i, role: makeAdmin ? "admin" : "user" }, headers: await headers() });
  });
}

/** Ban with an optional reason and length (days); no length means until an admin unbans. Banning also ends their sessions. */
export async function setBanned(id: string, banned: boolean, opts: { reason?: string; days?: number } = {}) {
  const reason = (opts.reason ?? "").trim().slice(0, 300);
  const days = Number.isFinite(opts.days) && opts.days && opts.days > 0 ? Math.min(Math.floor(opts.days), 3650) : undefined;
  return run(
    id,
    banned ? "user.ban" : "user.unban",
    async (i) => {
      if (banned)
        await auth.api.banUser({
          body: { userId: i, ...(reason ? { banReason: reason } : {}), ...(days ? { banExpiresIn: days * 86_400 } : {}) },
          headers: await headers(),
        });
      else await auth.api.unbanUser({ body: { userId: i }, headers: await headers() });
    },
    { meta: banned ? { reason: reason || null, days: days ?? null } : undefined, message: banned ? "User banned." : "User unbanned." },
  );
}

export type SessionInfo = { token: string; ip: string | null; agent: string | null; createdAt: string; expiresAt: string };

/** The user's active sign-ins (device and address, never any content). */
export async function getUserSessions(id: string): Promise<{ ok: true; sessions: SessionInfo[] } | { ok: false; error: string }> {
  try {
    await assertAdmin();
    if (!UUID.test(id)) return { ok: false, error: "Bad user id." };
    const r = (await auth.api.listUserSessions({ body: { userId: id }, headers: await headers() })) as {
      sessions?: {
        token: string;
        ipAddress?: string | null;
        userAgent?: string | null;
        createdAt: string | Date;
        expiresAt: string | Date;
      }[];
    };
    const now = Date.now();
    return {
      ok: true,
      sessions: (r.sessions ?? [])
        .filter((s) => new Date(s.expiresAt).getTime() > now)
        .map((s) => ({
          token: s.token,
          ip: s.ipAddress ?? null,
          agent: s.userAgent ?? null,
          createdAt: new Date(s.createdAt).toISOString(),
          expiresAt: new Date(s.expiresAt).toISOString(),
        })),
    };
  } catch {
    return { ok: false, error: "Not allowed." };
  }
}

/** Ends one sign-in. The token must belong to that user, so a token for someone else can't be revoked through this path. */
export async function revokeSession(id: string, token: string) {
  return run(
    id,
    "user.revoke_session",
    async (i) => {
      const r = await getUserSessions(i);
      if (!r.ok || !r.sessions.some((s) => s.token === token)) return { error: { message: "That session isn’t theirs." } };
      await auth.api.revokeUserSession({ body: { sessionToken: token }, headers: await headers() });
    },
    { protect: false, message: "Signed out of that device." },
  );
}

/** Signs the user out everywhere. */
export async function revokeAllSessions(id: string) {
  return run(
    id,
    "user.revoke_sessions",
    async (i) => {
      await auth.api.revokeUserSessions({ body: { userId: i }, headers: await headers() });
    },
    { protect: false, message: "Signed out everywhere." },
  );
}

/** Changes the display name (for example to fix a typo or remove something inappropriate). */
export async function renameUser(id: string, name: string) {
  const n = String(name ?? "")
    .replace(/\s+/g, " ")
    .trim();
  if (!n || n.length > 80) return { ok: false, error: "Enter a name up to 80 characters." } as Result;
  return run(
    id,
    "user.rename",
    async (i) => {
      await pool().query("update auth.users set name = $2, updated_at = now() where id = $1", [i, n]);
    },
    { protect: false, meta: { name: n }, message: "Name updated." },
  );
}

export async function deleteUser(id: string) {
  return run(id, "user.delete", async (i) => {
    await purgePrefix("note-files", `${i}/`);
    await purgePrefix("avatars", `${i}/`);
    await pool().query("delete from auth.users where id = $1", [i]);
  });
}

export async function setPlan(id: string, plan: string) {
  if (plan !== "free" && plan !== "pro") return { ok: false, error: "Unknown plan." } as Result;
  return run(id, "user.set_plan", async (i) => adminDb().from("profiles").upsert({ user_id: i, plan }, { onConflict: "user_id" }), {
    protect: false,
    meta: { plan },
    message: `Plan set to ${plan}.`,
  });
}

export async function sendPasswordReset(id: string) {
  const base = await origin();
  return run(
    id,
    "user.password_reset",
    async (_i, email) => {
      await auth.api.requestPasswordReset({ body: { email, redirectTo: `${base}/reset-password` } });
    },
    { protect: false, message: "Password reset email sent." },
  );
}

export async function resendConfirmation(id: string) {
  const base = await origin();
  return run(
    id,
    "user.resend_confirmation",
    async (_i, email) => {
      await auth.api.sendVerificationEmail({ body: { email, callbackURL: `${base}/dashboard` } });
    },
    { protect: false, message: "Confirmation email sent." },
  );
}

/** Creates an account for the email (verified, with an unusable random password) and emails a link to choose a password. */
export async function inviteUser(email: string): Promise<Result> {
  try {
    const me = await assertAdmin();
    const e = String(email || "")
      .trim()
      .toLowerCase();
    if (!EMAIL_RE.test(e)) return { ok: false, error: "Please enter a valid email address." };
    if (
      await pool()
        .query("select 1 from auth.users where email = $1", [e])
        .then((r) => r.rowCount)
    )
      return { ok: false, error: "That email already has an account." };
    const base = await origin();
    await auth.api.signUpEmail({ body: { email: e, password: randomBytes(24).toString("base64url"), name: e.split("@")[0] } });
    await pool().query("update auth.users set email_verified = true where email = $1", [e]);
    await auth.api.requestPasswordReset({ body: { email: e, redirectTo: `${base}/reset-password` } });
    await audit(me, "user.invite", e);
    revalidatePath("/admin", "layout");
    return { ok: true, message: `Invitation sent to ${e}.` };
  } catch {
    return { ok: false, error: "Couldn’t send that invitation." };
  }
}

export type Detail = {
  notes: number;
  tasks: number;
  journal: number;
  chats: number;
  messages: number;
  plan: string;
  lastSignIn: string | null;
  id: string;
};

/** Content counts for one user (never the content itself). */
export async function getUserDetail(id: string): Promise<{ ok: true; detail: Detail } | { ok: false; error: string }> {
  try {
    await assertAdmin();
    if (!UUID.test(id)) return { ok: false, error: "Bad user id." };
    const sb = adminDb();
    const n = async (t: string) => (await sb.from(t).select("*", { count: "exact", head: true }).eq("user_id", id)).count ?? 0;
    const [notes, tasks, journal, chats, messages, profile, u] = await Promise.all([
      n("notes"),
      n("tasks"),
      n("journal_entries"),
      n("chats"),
      n("chat_messages"),
      sb.from("profiles").select("plan").eq("user_id", id).maybeSingle(),
      getUserById(id),
    ]);
    return {
      ok: true,
      detail: {
        notes,
        tasks,
        journal,
        chats,
        messages,
        plan: (profile.data?.plan as string) ?? "free",
        lastSignIn: u?.lastSignIn ?? null,
        id,
      },
    };
  } catch {
    return { ok: false, error: "Not allowed." };
  }
}

/* ---------- announcements ---------- */
export async function createAnnouncement(message: string, tone: string): Promise<Result> {
  try {
    const me = await assertAdmin();
    const m = String(message || "")
      .trim()
      .slice(0, 500);
    if (!m) return { ok: false, error: "Write a message first." };
    if (!["info", "success", "warning"].includes(tone)) return { ok: false, error: "Unknown tone." };
    const { error } = await adminDb().from("announcements").insert({ message: m, tone, active: true });
    if (error) return { ok: false, error: error.message };
    await audit(me, "announcement.create", m.slice(0, 60), { tone });
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "Not allowed." };
  }
}

export async function toggleAnnouncement(id: string, active: boolean): Promise<Result> {
  try {
    const me = await assertAdmin();
    if (!UUID.test(id)) return { ok: false, error: "Bad id." };
    const { error } = await adminDb().from("announcements").update({ active }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    await audit(me, active ? "announcement.show" : "announcement.hide", id);
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "Not allowed." };
  }
}

export async function deleteAnnouncement(id: string): Promise<Result> {
  try {
    const me = await assertAdmin();
    if (!UUID.test(id)) return { ok: false, error: "Bad id." };
    const { error } = await adminDb().from("announcements").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    await audit(me, "announcement.delete", id);
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "Not allowed." };
  }
}
