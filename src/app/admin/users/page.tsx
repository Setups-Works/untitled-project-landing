import { isAdmin, isRootAdmin, listAllUsers, serverConfigured, currentUser, adminDb } from "../../../server/session";
import SetupNotice from "../../../components/admin/SetupNotice";
import UsersTable, { type Row } from "../../../components/admin/UsersTable";

export default async function Page() {
  if (!serverConfigured()) return <SetupNotice />;
  const [users, me, profiles] = await Promise.all([listAllUsers(), currentUser(), adminDb().from("profiles").select("user_id,plan")]);
  const plans = new Map((profiles.data ?? []).map((p) => [p.user_id as string, p.plan as string]));
  const rows: Row[] = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name || "",
    avatar: u.image || null,
    provider: u.providers[0] ?? "email",
    confirmed: !!u.emailVerified,
    admin: isAdmin(u),
    banned: u.banned,
    protected: isRootAdmin(u.email) || u.id === me?.id,
    plan: plans.get(u.id) ?? "free",
    createdAt: u.createdAt,
    lastSignIn: u.lastSignIn ?? null,
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
