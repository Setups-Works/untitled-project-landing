import "server-only";
import { createClient, type User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { SUPABASE_URL, supabaseConfigured } from "./config";
import { supabaseServer } from "./server";

export const serviceConfigured = Boolean(supabaseConfigured && process.env.SUPABASE_SERVICE_ROLE_KEY);

/** Service-role client. Bypasses RLS — only ever use it on the server, after requireAdmin(). */
export function supabaseAdmin() {
  return createClient(SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const adminEmails = () =>
  (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

/** Admin = listed in ADMIN_EMAILS, or promoted via app_metadata.role (only writable with the service key). */
export function isAdmin(user: Pick<User, "email" | "app_metadata"> | null | undefined) {
  if (!user) return false;
  return user.app_metadata?.role === "admin" || adminEmails().includes((user.email || "").toLowerCase());
}

/** Is this email protected from being demoted/banned/deleted from the panel? */
export const isRootAdmin = (email?: string | null) => adminEmails().includes((email || "").toLowerCase());

export async function currentUser() {
  if (!supabaseConfigured) return null;
  const { data } = await (await supabaseServer()).auth.getUser();
  return data.user ?? null;
}

/** For pages/layouts: sends visitors to log in, and non-admins to the dashboard. */
export async function requireAdmin() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/admin");
  if (!isAdmin(user)) redirect("/dashboard");
  return user;
}

/** For server actions: throws instead of redirecting. */
export async function assertAdmin() {
  const user = await currentUser();
  if (!isAdmin(user)) throw new Error("Not allowed");
  return user!;
}

/** Row count of a table (all users), using the service role. */
export async function countRows(table: string) {
  const { count } = await supabaseAdmin().from(table).select("*", { count: "exact", head: true });
  return count ?? 0;
}

/** Records an admin action in the audit log. Never throws — logging must not block the action itself. */
export async function audit(admin: Pick<User, "id" | "email">, action: string, target?: string | null, meta: Record<string, unknown> = {}) {
  try {
    await supabaseAdmin()
      .from("admin_audit")
      .insert({ admin_id: admin.id, admin_email: admin.email ?? "", action, target: target ?? null, meta });
  } catch {
    /* ignore */
  }
}

export async function listAllUsers() {
  const sb = supabaseAdmin();
  const users: User[] = [];
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }
  return users;
}
