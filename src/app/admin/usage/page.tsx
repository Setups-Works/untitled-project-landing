import { listAllUsers, serviceConfigured, supabaseAdmin } from "../../../lib/supabase/admin";
import SetupNotice from "../../../components/admin/SetupNotice";

const TABLES = [["notes", "Notes"], ["tasks", "Tasks"], ["journal_entries", "Journal"], ["chats", "Chats"], ["chat_messages", "Messages"]] as const;

export default async function Page() {
  if (!serviceConfigured) return <SetupNotice />;
  const sb = supabaseAdmin();
  const [users, ...rows] = await Promise.all([
    listAllUsers(),
    ...TABLES.map(([t]) => sb.from(t).select("user_id").limit(50000)),
  ]);
  // Counts per user per table. Only ids are read — never anyone's content.
  const counts = new Map<string, number[]>();
  rows.forEach((r, ti) => (r.data ?? []).forEach((row) => {
    const c = counts.get(row.user_id as string) ?? TABLES.map(() => 0);
    c[ti]++;
    counts.set(row.user_id as string, c);
  }));
  const table = users
    .map((u) => { const c = counts.get(u.id) ?? TABLES.map(() => 0); return { u, c, total: c.reduce((a, b) => a + b, 0) }; })
    .sort((a, b) => b.total - a.total);
  const max = Math.max(1, ...table.map((r) => r.total));
  const totals = TABLES.map((_, i) => table.reduce((a, r) => a + r.c[i], 0));
  const idle = table.filter((r) => r.total === 0).length;

  return (
    <div className="dash">
      <div className="dash-head">
        <div>
          <div className="eyebrow">Usage</div>
          <h1 className="h2" style={{ marginTop: 8 }}>Who’s using what</h1>
          <p className="meta">Item counts per user. {idle} of {users.length} {users.length === 1 ? "user hasn’t" : "users haven’t"} created anything yet.</p>
        </div>
      </div>
      <div className="dash-stats adm-six">
        {TABLES.map(([, l], i) => (
          <div className={`dash-stat at-${["violet", "blue", "amber", "mint", "clay"][i]}`} key={l}><b>{totals[i]}</b><small>{l}</small></div>
        ))}
      </div>
      <div className="dash-table">
        <table>
          <thead><tr><th>User</th>{TABLES.map(([, l]) => <th key={l}>{l}</th>)}<th>Total</th><th /></tr></thead>
          <tbody>
            {table.map(({ u, c, total }) => (
              <tr key={u.id}>
                <td><b>{(u.user_metadata?.full_name as string) || "—"}</b><br /><span className="meta">{u.email}</span></td>
                {c.map((n, i) => <td key={i}>{n || "—"}</td>)}
                <td><b>{total}</b></td>
                <td className="adm-meter"><i style={{ width: `${(total / max) * 100}%` }} /></td>
              </tr>
            ))}
            {table.length === 0 && <tr><td colSpan={8} className="empty">No users yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
