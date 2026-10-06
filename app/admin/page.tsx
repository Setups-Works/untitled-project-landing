import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import {
  faUsers, faUserPlus, faEnvelopeCircleCheck, faBolt, faPenToSquare, faListCheck, faBookOpen, faComments, faMessage, faCrown,
} from "@fortawesome/free-solid-svg-icons";
import { countRows, isAdmin, listAllUsers, serviceConfigured, supabaseAdmin } from "../../lib/supabase/admin";
import SetupNotice from "../../components/admin/SetupNotice";

const DAY = 86_400_000;

function Bars({ title, tone, data, note }: { title: string; tone: string; data: { label: string; n: number }[]; note: string }) {
  const max = Math.max(1, ...data.map((d) => d.n));
  return (
    <div className={`dash-card at-${tone}`}>
      <h4>{title}</h4>
      <div className="adm-chart" role="img" aria-label={title}>
        {data.map((d) => (
          <div key={d.label} title={`${d.label}: ${d.n}`}><i style={{ height: `${(d.n / max) * 100}%` }} /><small>{d.label.split(" ")[0]}</small></div>
        ))}
      </div>
      <p className="meta" style={{ marginTop: 12 }}>{note}</p>
    </div>
  );
}

export default async function Page() {
  if (!serviceConfigured) return <SetupNotice />;
  const [users, notes, tasks, journal, chats, messages, profiles] = await Promise.all([
    listAllUsers(), countRows("notes"), countRows("tasks"), countRows("journal_entries"), countRows("chats"), countRows("chat_messages"),
    supabaseAdmin().from("profiles").select("plan"),
  ]);
  const now = Date.now();
  const since = (iso?: string | null, days = 7) => !!iso && now - new Date(iso).getTime() < days * DAY;
  const pro = (profiles.data ?? []).filter((p) => p.plan === "pro").length;

  const stats = [
    [faUsers, "Total users", users.length, "violet"],
    [faUserPlus, "New this week", users.filter((u) => since(u.created_at)).length, "amber"],
    [faBolt, "Active this week", users.filter((u) => since(u.last_sign_in_at)).length, "blue"],
    [faEnvelopeCircleCheck, "Email confirmed", users.filter((u) => u.email_confirmed_at).length, "green"],
  ] as const;
  const content = [
    [faPenToSquare, "Notes", notes, "violet"], [faListCheck, "Tasks", tasks, "blue"], [faBookOpen, "Journal entries", journal, "amber"],
    [faComments, "Chats", chats, "mint"], [faMessage, "Messages", messages, "clay"], [faCrown, "Pro users", pro, "gold"],
  ] as const;

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now - (13 - i) * DAY);
    const key = d.toDateString();
    return {
      label: d.toLocaleDateString(undefined, { day: "numeric", month: "short" }),
      joined: users.filter((u) => new Date(u.created_at).toDateString() === key).length,
      seen: users.filter((u) => u.last_sign_in_at && new Date(u.last_sign_in_at).toDateString() === key).length,
    };
  });
  const recent = [...users].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 6);
  const google = users.filter((u) => u.app_metadata?.provider === "google").length;
  const avgNotes = users.length ? (notes / users.length).toFixed(1) : "0";

  return (
    <div className="dash">
      <div className="dash-head">
        <div>
          <div className="eyebrow">Overview</div>
          <h1 className="h2" style={{ marginTop: 8 }}>How it’s going</h1>
        </div>
      </div>
      <div className="dash-stats">
        {stats.map(([ic, l, n, t]) => (
          <div className={`dash-stat at-${t}`} key={l}>
            <span className="mega-ico"><FA icon={ic} /></span><b>{n}</b><small>{l}</small>
          </div>
        ))}
      </div>
      <div className="dash-stats adm-six">
        {content.map(([ic, l, n, t]) => (
          <div className={`dash-stat at-${t}`} key={l}>
            <span className="mega-ico"><FA icon={ic} /></span><b>{n}</b><small>{l}</small>
          </div>
        ))}
      </div>
      <div className="dash-grid">
        <Bars title="Sign-ups, last 14 days" tone="violet" data={days.map((d) => ({ label: d.label, n: d.joined }))} note={`${google} with Google · ${users.length - google} with email`} />
        <Bars title="Users last seen, per day" tone="blue" data={days.map((d) => ({ label: d.label, n: d.seen }))} note="Counts each user on the day of their latest sign-in." />
        <div className="dash-card at-mint">
          <h4>Latest sign-ups</h4>
          {recent.length === 0 && <p className="meta">No users yet.</p>}
          {recent.map((u) => (
            <blockquote key={u.id} style={{ fontStyle: "normal" }}>
              {(u.user_metadata?.full_name as string) || u.email}
              {isAdmin(u) && <b> · admin</b>}
              <small>{u.email} · {new Date(u.created_at).toLocaleDateString()}</small>
            </blockquote>
          ))}
        </div>
        <div className="dash-card at-amber">
          <h4>At a glance</h4>
          <dl className="st-facts">
            <div><dt>Notes per user</dt><dd>{avgNotes}</dd></div>
            <div><dt>Pro share</dt><dd>{users.length ? Math.round((pro / users.length) * 100) : 0}%</dd></div>
            <div><dt>Admins</dt><dd>{users.filter(isAdmin).length}</dd></div>
            <div><dt>Banned</dt><dd>{users.filter((u) => u.banned_until && new Date(u.banned_until) > new Date()).length}</dd></div>
            <div><dt>Unconfirmed</dt><dd>{users.filter((u) => !u.email_confirmed_at).length}</dd></div>
          </dl>
        </div>
      </div>
    </div>
  );
}
