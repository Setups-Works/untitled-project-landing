"use server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import type { User } from "@supabase/supabase-js";
import { assertAdmin, audit, isRootAdmin, supabaseAdmin } from "../../lib/supabase/admin";
import { EMAIL_RE } from "../../lib/validate";

type Result = { ok: true; message?: string } | { ok: false; error: string };
const UUID = /^[0-9a-f-]{36}$/i;

/** Loads the target user and refuses to touch yourself or an ADMIN_EMAILS account. */
type Guarded = { error: string; me?: undefined; user?: undefined } | { error?: undefined; me: User; user: User };
async function guard(id: string, protect = true): Promise<Guarded> {
  const me = await assertAdmin();
  if (typeof id !== "string" || !UUID.test(id)) return { error: "Bad user id." };
  const { data, error } = await supabaseAdmin().auth.admin.getUserById(id);
  if (error || !data.user) return { error: "User not found." };
  if (protect && data.user.id === me.id) return { error: "You can’t do that to your own account." };
  if (protect && isRootAdmin(data.user.email)) return { error: "This account is a protected admin (ADMIN_EMAILS)." };
  return { me, user: data.user };
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
  fn: (userId: string, email: string) => Promise<{ error: { message: string } | null }>,
  opts: { protect?: boolean; meta?: Record<string, unknown>; message?: string } = {},
): Promise<Result> {
  try {
    const g = await guard(id, opts.protect ?? true);
    if (g.error !== undefined) return { ok: false, error: g.error };
    const { error } = await fn(g.user.id, g.user.email ?? "");
    if (error) return { ok: false, error: error.message };
    await audit(g.me, action, g.user.email ?? id, opts.meta);
    revalidatePath("/admin", "layout");
    return { ok: true, message: opts.message };
  } catch {
    return { ok: false, error: "Not allowed." };
  }
}

export async function setAdminRole(id: string, makeAdmin: boolean) {
  return run(id, makeAdmin ? "user.make_admin" : "user.remove_admin", (i) => supabaseAdmin().auth.admin.updateUserById(i, { app_metadata: { role: makeAdmin ? "admin" : null } }));
}

export async function setBanned(id: string, banned: boolean) {
  return run(id, banned ? "user.ban" : "user.unban", (i) => supabaseAdmin().auth.admin.updateUserById(i, { ban_duration: banned ? "876000h" : "none" }));
}

export async function deleteUser(id: string) {
  return run(id, "user.delete", (i) => supabaseAdmin().auth.admin.deleteUser(i));
}

export async function setPlan(id: string, plan: string) {
  if (plan !== "free" && plan !== "pro") return { ok: false, error: "Unknown plan." } as Result;
  return run(id, "user.set_plan", async (i) => supabaseAdmin().from("profiles").upsert({ user_id: i, plan }, { onConflict: "user_id" }), { protect: false, meta: { plan }, message: `Plan set to ${plan}.` });
}

export async function sendPasswordReset(id: string) {
  const base = await origin();
  return run(id, "user.password_reset", (_i, email) => supabaseAdmin().auth.resetPasswordForEmail(email, { redirectTo: `${base}/auth/callback?next=/reset-password` }), { protect: false, message: "Password reset email sent." });
}

export async function resendConfirmation(id: string) {
  const base = await origin();
  return run(id, "user.resend_confirmation", (_i, email) => supabaseAdmin().auth.resend({ type: "signup", email, options: { emailRedirectTo: `${base}/auth/callback?next=/dashboard` } }), { protect: false, message: "Confirmation email sent." });
}

export async function inviteUser(email: string): Promise<Result> {
  try {
    const me = await assertAdmin();
    const e = String(email || "").trim().toLowerCase();
    if (!EMAIL_RE.test(e)) return { ok: false, error: "Please enter a valid email address." };
    const { error } = await supabaseAdmin().auth.admin.inviteUserByEmail(e, { redirectTo: `${await origin()}/auth/callback?next=/dashboard` });
    if (error) return { ok: false, error: error.message };
    await audit(me, "user.invite", e);
    revalidatePath("/admin", "layout");
    return { ok: true, message: `Invitation sent to ${e}.` };
  } catch {
    return { ok: false, error: "Not allowed." };
  }
}

export type Detail = { notes: number; tasks: number; journal: number; chats: number; messages: number; plan: string; lastSignIn: string | null; id: string };

/** Content counts for one user (never the content itself). */
export async function getUserDetail(id: string): Promise<{ ok: true; detail: Detail } | { ok: false; error: string }> {
  try {
    await assertAdmin();
    if (!UUID.test(id)) return { ok: false, error: "Bad user id." };
    const sb = supabaseAdmin();
    const n = async (t: string) => (await sb.from(t).select("*", { count: "exact", head: true }).eq("user_id", id)).count ?? 0;
    const [notes, tasks, journal, chats, messages, profile, u] = await Promise.all([
      n("notes"), n("tasks"), n("journal_entries"), n("chats"), n("chat_messages"),
      sb.from("profiles").select("plan").eq("user_id", id).maybeSingle(),
      sb.auth.admin.getUserById(id),
    ]);
    return { ok: true, detail: { notes, tasks, journal, chats, messages, plan: (profile.data?.plan as string) ?? "free", lastSignIn: u.data.user?.last_sign_in_at ?? null, id } };
  } catch {
    return { ok: false, error: "Not allowed." };
  }
}

/* ---------- announcements ---------- */
export async function createAnnouncement(message: string, tone: string): Promise<Result> {
  try {
    const me = await assertAdmin();
    const m = String(message || "").trim().slice(0, 500);
    if (!m) return { ok: false, error: "Write a message first." };
    if (!["info", "success", "warning"].includes(tone)) return { ok: false, error: "Unknown tone." };
    const { error } = await supabaseAdmin().from("announcements").insert({ message: m, tone, active: true });
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
    const { error } = await supabaseAdmin().from("announcements").update({ active }).eq("id", id);
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
    const { error } = await supabaseAdmin().from("announcements").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    await audit(me, "announcement.delete", id);
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "Not allowed." };
  }
}
