import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { serverEnv } from "../config/env";
import { auth } from "./auth";
import { execute } from "./db/execute";
import { pool } from "./db/pool";
import { makeFrom } from "../lib/api/builder";

/** The signed-in user as the rest of the app sees them. */
export type AppUser = {
  id: string;
  email: string;
  name: string;
  image: string | null;
  emailVerified: boolean;
  role: "admin" | null;
  banned: boolean;
  createdAt: string;
};

/** A user row for the admin panel: AppUser plus activity and how they sign in. */
export type AdminUser = AppUser & { lastSignIn: string | null; providers: string[] };

export const adminEmails = () => serverEnv().adminEmails;

/** Are the database and auth secret set? Pages show a setup notice instead of crashing when they aren't. */
export const serverConfigured = () => {
  const e = serverEnv();
  return Boolean(e.databaseUrl && e.authSecret);
};

/** The user for this request (null when signed out or suspended). Cheap: served from the cookie cache / Redis-backed session. */
export async function currentUser(): Promise<AppUser | null> {
  const s = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!s?.user) return null;
  const u = s.user as typeof s.user & { role?: string | null; banned?: boolean | null };
  if (u.banned) return null;
  return {
    id: u.id,
    email: u.email,
    name: u.name ?? "",
    image: u.image ?? null,
    emailVerified: u.emailVerified,
    role: u.role === "admin" ? "admin" : null,
    banned: false,
    createdAt: new Date(u.createdAt).toISOString(),
  };
}

/** Admin = listed in ADMIN_EMAILS, or promoted in the admin panel (users.role = 'admin'). */
export function isAdmin(user: Pick<AppUser, "email" | "role"> | null | undefined) {
  if (!user) return false;
  return user.role === "admin" || adminEmails().includes(user.email.toLowerCase());
}

/** Is this email protected from being demoted/banned/deleted from the panel? */
export const isRootAdmin = (email?: string | null) => adminEmails().includes((email || "").toLowerCase());

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
  if (!user || !isAdmin(user)) throw new Error("Not allowed");
  return user;
}

/**
 * Query builder that runs as the database owner and therefore bypasses Row-Level Security.
 * Only use it on the server, after verifying the caller (admin panel, public shared chats, account deletion).
 */
export const adminDb = () => makeFrom((spec) => execute(spec, { kind: "owner" }));

/** Query builder for server code that should see exactly what this user sees (Row-Level Security applies). */
export const userDb = (userId: string) => makeFrom((spec) => execute(spec, { kind: "user", userId }));

/** Row count of a table (all users). */
export async function countRows(table: string) {
  const { count } = await adminDb().from(table).select("*", { count: "exact", head: true });
  return count ?? 0;
}

/** Records an admin action in the audit log. Never throws — logging must not block the action itself. */
export async function audit(
  admin: Pick<AppUser, "id" | "email">,
  action: string,
  target?: string | null,
  meta: Record<string, unknown> = {},
) {
  try {
    await adminDb()
      .from("admin_audit")
      .insert({ admin_id: admin.id, admin_email: admin.email, action, target: target ?? null, meta });
  } catch {
    /* ignore */
  }
}

const ADMIN_USER_SQL = `
  select u.id, u.email, u.name, u.image, u.email_verified, u.role, u.banned, u.created_at,
         (select max(s.created_at) from auth.sessions s where s.user_id = u.id) as last_sign_in,
         coalesce((select array_agg(distinct a.provider_id) from auth.accounts a where a.user_id = u.id), '{}') as providers
  from auth.users u`;

type Row = {
  id: string;
  email: string;
  name: string;
  image: string | null;
  email_verified: boolean;
  role: string | null;
  banned: boolean;
  created_at: Date | string;
  last_sign_in: Date | string | null;
  providers: string[];
};

const iso = (v: Date | string) => new Date(v).toISOString();
const toAdminUser = (r: Row): AdminUser => ({
  id: r.id,
  email: r.email,
  name: r.name,
  image: r.image,
  emailVerified: r.email_verified,
  role: r.role === "admin" ? "admin" : null,
  banned: r.banned,
  createdAt: iso(r.created_at),
  lastSignIn: r.last_sign_in ? iso(r.last_sign_in) : null,
  providers: r.providers.map((p) => (p === "credential" ? "email" : p)),
});

export async function listAllUsers(): Promise<AdminUser[]> {
  const { rows } = await pool().query<Row>(`${ADMIN_USER_SQL} order by u.created_at desc limit 5000`);
  return rows.map(toAdminUser);
}

export async function getUserById(id: string): Promise<AdminUser | null> {
  const { rows } = await pool().query<Row>(`${ADMIN_USER_SQL} where u.id = $1`, [id]);
  return rows[0] ? toAdminUser(rows[0]) : null;
}

/** Item counts per user for the given tables, in the same order: Map(userId → [countTable1, countTable2, …]). */
export async function contentCounts(tables: readonly string[]) {
  const allowed = ["notes", "tasks", "journal_entries", "chats", "chat_messages"];
  const list = tables.filter((t) => allowed.includes(t));
  const out = new Map<string, number[]>();
  for (const [i, t] of list.entries()) {
    const { rows } = await pool().query<{ user_id: string; n: number }>(
      `select user_id, count(*)::int as n from public."${t}" group by user_id`,
    );
    for (const r of rows) {
      const c = out.get(r.user_id) ?? list.map(() => 0);
      c[i] = r.n;
      out.set(r.user_id, c);
    }
  }
  return out;
}

/** Sign-in methods and last sign-in for one user (shown on the Settings page). */
export async function accountInfo(userId: string) {
  const u = await getUserById(userId);
  return { providers: u?.providers ?? ["email"], lastSignIn: u?.lastSignIn ?? null };
}
