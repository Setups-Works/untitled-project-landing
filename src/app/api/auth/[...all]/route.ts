import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "../../../../server/auth";
import { pool } from "../../../../server/db/pool";
import { adminEmails } from "../../../../server/session";
import { audit, isRootAdmin, type AppUser } from "../../../../server/session";

// Sign up, sign in, OAuth callbacks, email verification, password reset, sessions: all handled by Better Auth.
const handlers = toNextJsHandler(auth);
const protectedMutations = new Set([
  "admin/set-role",
  "admin/ban-user",
  "admin/unban-user",
  "admin/remove-user",
  "admin/impersonate-user",
  "admin/set-user-password",
  "admin/update-user",
  "admin/revoke-user-sessions",
  "admin/revoke-user-session",
]);
const auditedMutations = new Set([
  ...protectedMutations,
  "admin/create-user",
  "admin/stop-impersonating",
]);
const UUID = /^[0-9a-f-]{36}$/i;

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

export const GET = handlers.GET;

export async function POST(request: Request) {
  const path = new URL(request.url).pathname.split("/api/auth/")[1] ?? "";
  const session = path.startsWith("admin/") ? await auth.api.getSession({ headers: request.headers }).catch(() => null) : null;
  if (session?.user && adminEmails().includes(session.user.email.toLowerCase())) {
    // ADMIN_EMAILS remains the source of truth for bootstrap admins; sync it before the plugin checks role.
    await pool().query("update auth.users set role = 'admin', updated_at = now() where id = $1 and role is distinct from 'admin'", [session.user.id]);
  }

  let body: Record<string, unknown> = {};
  if (session && request.method === "POST") {
    try {
      body = record(await request.clone().json());
    } catch {
      body = {};
    }
  }

  const targetPath = path.replace(/^\//, "");
  if (session && protectedMutations.has(targetPath)) {
    let targetId = typeof body.userId === "string" ? body.userId : "";
    if (targetPath === "admin/revoke-user-session" && typeof body.sessionToken === "string") {
      const { rows } = await pool().query<{ user_id: string }>("select user_id from auth.sessions where token = $1", [body.sessionToken]);
      targetId = rows[0]?.user_id ?? "";
    }
    if (UUID.test(targetId)) {
      if (targetId === session.user.id) return Response.json({ code: "FORBIDDEN", message: "You can’t perform this action on your own account." }, { status: 403 });
      const { rows } = await pool().query<{ email: string }>("select email from auth.users where id = $1", [targetId]);
      if (rows[0] && isRootAdmin(rows[0].email)) {
        return Response.json({ code: "FORBIDDEN", message: "This account is a protected admin." }, { status: 403 });
      }
    }
  }

  const response = await handlers.POST(request);
  if (session && response.ok && auditedMutations.has(targetPath)) {
    const actor: Pick<AppUser, "id" | "email"> = { id: session.user.id, email: session.user.email };
    const target = typeof body.userId === "string" ? body.userId : typeof body.email === "string" ? body.email : null;
    await audit(actor, `auth.${targetPath.replaceAll("/", ".")}`, target);
  }
  return response;
}
