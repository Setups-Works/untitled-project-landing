import { serviceConfigured, supabaseAdmin } from "../../../lib/supabase/admin";
import SetupNotice from "../../../components/admin/SetupNotice";

const LABELS: Record<string, string> = {
  "user.make_admin": "Made admin", "user.remove_admin": "Removed admin", "user.ban": "Banned user", "user.unban": "Unbanned user",
  "user.delete": "Deleted user", "user.set_plan": "Changed plan", "user.password_reset": "Sent password reset", "user.resend_confirmation": "Resent confirmation",
  "user.invite": "Invited user", "announcement.create": "Created announcement", "announcement.show": "Showed announcement",
  "announcement.hide": "Hid announcement", "announcement.delete": "Deleted announcement",
};

export default async function Page() {
  if (!serviceConfigured) return <SetupNotice />;
  const { data, error } = await supabaseAdmin().from("admin_audit").select("id,admin_email,action,target,meta,created_at").order("created_at", { ascending: false }).limit(200);
  return (
    <div className="dash">
      <div className="dash-head">
        <div>
          <div className="eyebrow">Audit log</div>
          <h1 className="h2" style={{ marginTop: 8 }}>What admins did</h1>
          <p className="meta">The latest 200 actions. Entries can’t be edited or deleted from the app.</p>
        </div>
      </div>
      {error && <p className="form-err" role="alert">Couldn’t load the audit log. Make sure the latest database migration has been applied.</p>}
      <div className="dash-table">
        <table>
          <thead><tr><th>When</th><th>Admin</th><th>Action</th><th>Target</th><th>Details</th></tr></thead>
          <tbody>
            {(data ?? []).map((r) => (
              <tr key={r.id as string}>
                <td>{new Date(r.created_at as string).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                <td>{r.admin_email as string}</td>
                <td><span className="adm-pill" data-k={String(r.action).includes("delete") || String(r.action).includes("ban") ? "ban" : undefined}>{LABELS[r.action as string] ?? (r.action as string)}</span></td>
                <td className="wrap">{(r.target as string) || "—"}</td>
                <td className="wrap">{Object.keys((r.meta as object) ?? {}).length ? Object.entries(r.meta as Record<string, unknown>).map(([k, v]) => `${k}: ${v}`).join(", ") : "—"}</td>
              </tr>
            ))}
            {(data ?? []).length === 0 && <tr><td colSpan={5} className="empty">No admin actions recorded yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
