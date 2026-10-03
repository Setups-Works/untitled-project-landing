"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faDownload, faTrash, faRightFromBracket, faUsers, faClipboardList, faCalendarDay, faPercent } from "@fortawesome/free-solid-svg-icons";

type W = { _id: string; name: string; email: string; role?: string; source?: string; createdAt: string };
type S = {
  _id: string; email: string | null; role: string; tools: string[]; pains: string[]; features: string[]; ai: string; pay: string; budget: string;
  switchReason: string; createdAt: string;
};

const fmt = (iso: string) => new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const COLORS = ["var(--violet-fg)", "var(--blue-fg)", "var(--green-fg)", "var(--amber-fg)", "var(--clay-fg)", "var(--sand-fg)"];
const TONES = ["violet", "blue", "green", "amber", "clay", "sand"];

function Bars({ title, items, total, n = 0 }: { title: string; items: [string, number][]; total: number; n?: number }) {
  const max = Math.max(1, ...items.map((i) => i[1]));
  return (
    <div className={`dash-card at-${TONES[n % TONES.length]}`}>
      <h4>{title}</h4>
      {items.length === 0 && <p className="meta">No data yet.</p>}
      {items.map(([k, v], r) => (
        <div className="bar" key={k}>
          <span>{k}</span>
          <div><i style={{ width: `${(v / max) * 100}%`, background: COLORS[(r + n) % COLORS.length] }} /></div>
          <b>{v}<small> {total ? Math.round((v / total) * 100) : 0}%</small></b>
        </div>
      ))}
    </div>
  );
}

const count = (rows: S[], pick: (r: S) => string | string[]) => {
  const m = new Map<string, number>();
  rows.forEach((r) => [pick(r)].flat().filter(Boolean).forEach((k) => m.set(k, (m.get(k) || 0) + 1)));
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};

export default function Dashboard({ email, waitlist, surveys }: { email: string; waitlist: W[]; surveys: S[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"insights" | "waitlist" | "survey">("insights");
  const [q, setQ] = useState("");

  const today = waitlist.filter((w) => new Date(w.createdAt).toDateString() === new Date().toDateString()).length;
  const linked = surveys.filter((s) => s.email && waitlist.some((w) => w.email === s.email)).length;
  const wf = useMemo(() => waitlist.filter((w) => (w.name + w.email + (w.role || "")).toLowerCase().includes(q.toLowerCase())), [waitlist, q]);
  const sf = useMemo(() => surveys.filter((s) => ((s.email || "") + s.role + s.ai + s.switchReason).toLowerCase().includes(q.toLowerCase())), [surveys, q]);

  async function del(type: "waitlist" | "survey", id: string) {
    if (!confirm("Delete this entry? This can’t be undone.")) return;
    await fetch("/api/admin/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, id }) });
    router.refresh();
  }
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="dash">
      <div className="dash-head">
        <div>
          <div className="eyebrow">Admin</div>
          <h1 className="h2" style={{ marginTop: 8 }}>Waitlist &amp; survey</h1>
          <p className="meta">Signed in as {email}</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={logout}><FA icon={faRightFromBracket} /> Sign out</button>
      </div>

      <div className="dash-stats">
        {[
          [faUsers, "Waitlist", waitlist.length, "violet"],
          [faCalendarDay, "Joined today", today, "amber"],
          [faClipboardList, "Survey responses", surveys.length, "blue"],
          [faPercent, "Survey from waitlist", waitlist.length ? `${Math.round((linked / waitlist.length) * 100)}%` : "—", "green"],
        ].map(([ic, l, n, t]) => (
          <div className={`dash-stat at-${t}`} key={String(l)}>
            <span className="mega-ico"><FA icon={ic as typeof faUsers} /></span>
            <b>{n as string}</b>
            <small>{l as string}</small>
          </div>
        ))}
      </div>

      <div className="dash-tabs">
        <div role="tablist">
          {([["insights", "Insights"], ["waitlist", `Waitlist (${waitlist.length})`], ["survey", `Survey (${surveys.length})`]] as const).map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} className="tab" onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
        {tab !== "insights" && (
          <div className="dash-tools">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" aria-label="Search" />
            <a className="btn btn-secondary btn-sm" href={`/api/admin/export?type=${tab}`}><FA icon={faDownload} /> CSV</a>
          </div>
        )}
      </div>

      {tab === "insights" && (
        <div className="dash-grid">
          <Bars title="Who’s responding" items={count(surveys, (r) => r.role)} total={surveys.length} n={0} />
          <Bars title="How they want AI" items={count(surveys, (r) => r.ai)} total={surveys.length} n={1} />
          <Bars title="Top frustrations" items={count(surveys, (r) => r.pains)} total={surveys.length} n={2} />
          <Bars title="Features they want" items={count(surveys, (r) => r.features)} total={surveys.length} n={3} />
          <Bars title="Tools used today" items={count(surveys, (r) => r.tools)} total={surveys.length} n={4} />
          <Bars title="Would pay for Pro" items={count(surveys, (r) => r.pay)} total={surveys.length} n={5} />
          <Bars title="Monthly budget" items={count(surveys, (r) => r.budget)} total={surveys.length} n={6} />
          <div className="dash-card at-blue">
            <h4>What would make them switch</h4>
            {surveys.filter((s) => s.switchReason).slice(0, 6).map((s) => <blockquote key={s._id}>“{s.switchReason}”<small>{s.role}</small></blockquote>)}
            {!surveys.some((s) => s.switchReason) && <p className="meta">No answers yet.</p>}
          </div>
        </div>
      )}

      {tab === "waitlist" && (
        <div className="dash-table">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Source</th><th>Joined</th><th /></tr></thead>
            <tbody>
              {wf.map((w) => (
                <tr key={w._id}>
                  <td>{w.name}</td><td>{w.email}</td><td>{w.role || "—"}</td><td>{w.source || "—"}</td><td>{fmt(w.createdAt)}</td>
                  <td><button className="icon-btn" aria-label={`Delete ${w.email}`} onClick={() => del("waitlist", w._id)}><FA icon={faTrash} /></button></td>
                </tr>
              ))}
              {wf.length === 0 && <tr><td colSpan={6} className="empty">Nothing here yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === "survey" && (
        <div className="dash-table">
          <table>
            <thead><tr><th>Email</th><th>Role</th><th>AI</th><th>Pay</th><th>Budget</th><th>Top features</th><th>Why switch</th><th>Sent</th><th /></tr></thead>
            <tbody>
              {sf.map((s) => (
                <tr key={s._id}>
                  <td>{s.email || "anonymous"}</td><td>{s.role}</td><td>{s.ai}</td><td>{s.pay || "—"}</td><td>{s.budget || "—"}</td>
                  <td>{s.features.slice(0, 3).join(", ") || "—"}</td><td className="wrap">{s.switchReason || "—"}</td><td>{fmt(s.createdAt)}</td>
                  <td><button className="icon-btn" aria-label="Delete response" onClick={() => del("survey", s._id)}><FA icon={faTrash} /></button></td>
                </tr>
              ))}
              {sf.length === 0 && <tr><td colSpan={9} className="empty">Nothing here yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
