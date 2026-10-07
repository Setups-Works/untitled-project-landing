import { isAdmin, isRootAdmin, listAllUsers, serviceConfigured, currentUser, supabaseAdmin } from "../../../lib/supabase/admin";
import SetupNotice from "../../../components/admin/SetupNotice";
import UsersTable, { type Row } from "../../../components/admin/UsersTable";

export default async function Page() {
  if (!serviceConfigured) return <SetupNotice />;
  const [users, me, profiles] = await Promise.all([listAllUsers(), currentUser(), supabaseAdmin().from("profiles").select("user_id,plan")]);
  const plans = new Map((profiles.data ?? []).map((p) => [p.user_id as string, p.plan as string]));
  const rows: Row[] = users.map((u) => ({
    id: u.id,
    email: u.email ?? "",
    name: (u.user_metadata?.full_name as string) || "",
    avatar: (u.user_metadata?.avatar_url as string) || null,
    provider: String(u.app_metadata?.provider || "email"),
    confirmed: !!u.email_confirmed_at,
    admin: isAdmin(u),
    banned: !!u.banned_until && new Date(u.banned_until) > new Date(),
    protected: isRootAdmin(u.email) || u.id === me?.id,
    plan: plans.get(u.id) ?? "free",
    createdAt: u.created_at,
    lastSignIn: u.last_sign_in_at ?? null,
  }));
  return (
    <div className="dash">
      <div className="dash-head">
        <div>
          <div className="eyebrow">Users</div>
          <h1 className="h2" style={{ marginTop: 8 }}>
            {rows.length} {rows.length === 1 ? "user" : "users"}
          </h1>
          <p className="meta">Click a user to see usage and manage their account.</p>
        </div>
      </div>
      <UsersTable rows={rows} />
    </div>
  );
}
