"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faDownload,
  faEnvelope,
  faKey,
  faUserPlus,
  faXmark,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import {
  deleteUser,
  getUserDetail,
  getUserSessions,
  inviteUser,
  renameUser,
  resendConfirmation,
  revokeAllSessions,
  revokeSession,
  sendPasswordReset,
  setAdminRole,
  setBanned,
  setPlan,
  type Detail,
  type SessionInfo,
} from "../../app/admin/actions";
import { useConfirm } from "../ui/Confirm";
import Modal from "../ui/Modal";

export type Row = {
  id: string;
  email: string;
  name: string;
  provider: string;
  confirmed: boolean;
  admin: boolean;
  banned: boolean;
  protected: boolean;
  plan: string;
  createdAt: string;
  lastSignIn: string | null;
  avatar: string | null;
};

type Filter = "all" | "admin" | "banned" | "unconfirmed" | "pro";
type Sort = "newest" | "oldest" | "seen" | "name";
const PAGE = 20;

const fmt = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";
const csv = (v: unknown) => {
  let s = String(v ?? "");
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
};

/** "Chrome on macOS" style label from a user-agent string; falls back to the raw start of it. */
function device(agent: string | null) {
  if (!agent) return "Unknown device";
  const browser = /Edg\//.test(agent)
    ? "Edge"
    : /Chrome\//.test(agent)
      ? "Chrome"
      : /Firefox\//.test(agent)
        ? "Firefox"
        : /Safari\//.test(agent)
          ? "Safari"
          : null;
  const os = /Windows/.test(agent)
    ? "Windows"
    : /iPhone|iPad/.test(agent)
      ? "iOS"
      : /Android/.test(agent)
        ? "Android"
        : /Mac OS X/.test(agent)
          ? "macOS"
          : /Linux/.test(agent)
            ? "Linux"
            : null;
  return browser && os ? `${browser} on ${os}` : browser || os || agent.slice(0, 40);
}

const BAN_LENGTHS: [string, number][] = [
  ["Until I unban", 0],
  ["1 day", 1],
  ["7 days", 7],
  ["30 days", 30],
];

function Pills({ r }: { r: Row }) {
  return (
    <>
      {r.admin && (
        <span className="adm-pill" data-k="admin">
          Admin
        </span>
      )}
      {r.plan === "pro" && (
        <span className="adm-pill" data-k="pro">
          Pro
        </span>
      )}
      {r.banned && (
        <span className="adm-pill" data-k="ban">
          Banned
        </span>
      )}
      {!r.confirmed && (
        <span className="adm-pill" data-k="warn">
          Unconfirmed
        </span>
      )}
      {!r.admin && !r.banned && r.confirmed && r.plan !== "pro" && <span className="adm-pill">Active</span>}
    </>
  );
}

function UserDrawer({ row, onClose }: { row: Row; onClose: () => void }) {
  const { ask, dialog } = useConfirm();
  const [pending, start] = useTransition();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [sessions, setSessions] = useState<SessionInfo[] | null>(null);
  const [name, setName] = useState(row.name);
  const [reason, setReason] = useState("");
  const [days, setDays] = useState(0);

  const loadSessions = () => getUserSessions(row.id).then((r) => setSessions(r.ok ? r.sessions : []));

  useEffect(() => {
    let live = true;
    getUserDetail(row.id).then((r) => {
      if (live) {
        if (r.ok) setDetail(r.detail);
        else setMsg({ ok: false, text: r.error });
      }
    });
    getUserSessions(row.id).then((r) => {
      if (live) setSessions(r.ok ? r.sessions : []);
    });
    return () => {
      live = false;
    };
  }, [row.id]);

  const act = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>, confirm?: Parameters<typeof ask>[0]) => {
    start(async () => {
      if (confirm && !(await ask(confirm))) return;
      setMsg(null);
      const r = await fn();
      setMsg(r.ok ? { ok: true, text: r.message ?? "Done." } : { ok: false, text: r.error ?? "Something went wrong." });
      if (r.ok && r.message === undefined && confirm?.confirmLabel === "Delete user") onClose();
      else if (r.ok) await loadSessions();
    });
  };

  const stats: [string, number | undefined][] = [
    ["Notes", detail?.notes],
    ["Tasks", detail?.tasks],
    ["Journal entries", detail?.journal],
    ["Chats", detail?.chats],
    ["Messages", detail?.messages],
  ];

  return (
    <Modal label={`User ${row.email}`} onClose={onClose} size="lg">
      {dialog}
      <div className="ud">
        <div className="ud-head">
          <span className="ud-pic">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {row.avatar ? <img src={row.avatar} alt="" /> : (row.name || row.email)[0]?.toUpperCase()}
          </span>
          <div>
            <h2 className="h3">{row.name || row.email.split("@")[0]}</h2>
            <p className="meta">{row.email}</p>
            <div className="ud-pills">
              <Pills r={row} />
            </div>
          </div>
          <button className="ne-btn" aria-label="Close" onClick={onClose}>
            <FA icon={faXmark} />
          </button>
        </div>

        <dl className="ud-facts">
          <div>
            <dt>Joined</dt>
            <dd>{fmt(row.createdAt)}</dd>
          </div>
          <div>
            <dt>Last seen</dt>
            <dd>{fmt(detail?.lastSignIn ?? row.lastSignIn)}</dd>
          </div>
          <div>
            <dt>Sign-in</dt>
            <dd>{row.provider}</dd>
          </div>
          <div>
            <dt>User ID</dt>
            <dd className="ud-id">{row.id}</dd>
          </div>
        </dl>

        <h3 className="ud-h">Usage</h3>
        <div className="ud-stats">
          {stats.map(([l, n]) => (
            <div key={l}>
              <b>{n ?? "…"}</b>
              <small>{l}</small>
            </div>
          ))}
        </div>
        <p className="meta ud-note">Counts only — admins can’t read anyone’s notes, journal or chats from here.</p>

        <h3 className="ud-h">Plan</h3>
        <div className="st-seg" role="radiogroup" aria-label="Plan">
          {(["free", "pro"] as const).map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={row.plan === p}
              data-on={row.plan === p}
              disabled={pending}
              onClick={() => row.plan !== p && act(() => setPlan(row.id, p))}
            >
              {p === "pro" ? "Pro" : "Free"}
            </button>
          ))}
        </div>

        <h3 className="ud-h">Sign-ins</h3>
        {sessions === null ? (
          <p className="meta">Loading…</p>
        ) : sessions.length === 0 ? (
          <p className="meta">Not signed in anywhere right now.</p>
        ) : (
          <>
            <ul className="ud-sessions">
              {sessions.map((s) => (
                <li key={s.token}>
                  <span>
                    <b>{device(s.agent)}</b>
                    <small className="meta">
                      {s.ip ?? "unknown address"} · signed in {fmt(s.createdAt)}
                    </small>
                  </span>
                  <button className="btn btn-secondary btn-sm" disabled={pending} onClick={() => act(() => revokeSession(row.id, s.token))}>
                    Sign out
                  </button>
                </li>
              ))}
            </ul>
            <div className="ud-acts">
              <button
                className="btn btn-secondary btn-sm"
                disabled={pending}
                onClick={() =>
                  act(() => revokeAllSessions(row.id), {
                    title: "Sign out everywhere?",
                    body: <>{row.email} will be signed out of every device and must sign in again.</>,
                    confirmLabel: "Sign out everywhere",
                  })
                }
              >
                Sign out everywhere
              </button>
            </div>
          </>
        )}

        <h3 className="ud-h">Account</h3>
        <form
          className="ud-acts"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim() && name.trim() !== row.name) act(() => renameUser(row.id, name));
          }}
        >
          <input
            className="tf-title adm-in"
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            aria-label="Display name"
          />
          <button className="btn btn-secondary btn-sm" disabled={pending || !name.trim() || name.trim() === row.name}>
            Rename
          </button>
        </form>
        <div className="ud-acts">
          <button className="btn btn-secondary btn-sm" disabled={pending} onClick={() => act(() => sendPasswordReset(row.id))}>
            <FA icon={faKey} /> Send password reset
          </button>
          {!row.confirmed && (
            <button className="btn btn-secondary btn-sm" disabled={pending} onClick={() => act(() => resendConfirmation(row.id))}>
              <FA icon={faEnvelope} /> Resend confirmation
            </button>
          )}
        </div>

        <h3 className="ud-h">Access</h3>
        {row.protected ? (
          <p className="meta">
            This is your own account or a protected admin from <code>ADMIN_EMAILS</code>, so it can’t be demoted, banned or deleted here.
          </p>
        ) : (
          <>
            {!row.banned && (
              <div className="ud-acts">
                <input
                  className="tf-title adm-in"
                  value={reason}
                  maxLength={300}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ban reason (optional)"
                  aria-label="Ban reason"
                />
                <label className="tv-select">
                  <select value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Ban length">
                    {BAN_LENGTHS.map(([l, d]) => (
                      <option key={d} value={d}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
            <div className="ud-acts">
              <button
                className="btn btn-secondary btn-sm"
                disabled={pending}
                onClick={() =>
                  act(
                    () => setAdminRole(row.id, !row.admin),
                    row.admin
                      ? {
                          title: "Remove admin access?",
                          body: <>{row.email} will no longer be able to open the admin panel.</>,
                          confirmLabel: "Remove admin",
                        }
                      : {
                          title: "Make this user an admin?",
                          body: <>{row.email} will get full access to the admin panel, including deleting users.</>,
                          confirmLabel: "Make admin",
                        },
                  )
                }
              >
                {row.admin ? "Remove admin" : "Make admin"}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                disabled={pending}
                onClick={() =>
                  act(
                    () => setBanned(row.id, !row.banned, { reason, days }),
                    row.banned
                      ? undefined
                      : {
                          title: "Ban this user?",
                          body: (
                            <>
                              {row.email} will be signed out and can’t sign in{" "}
                              {days ? `for ${days} ${days === 1 ? "day" : "days"}` : "until you unban them"}.
                            </>
                          ),
                          confirmLabel: "Ban user",
                          danger: true,
                        },
                  )
                }
              >
                {row.banned ? "Unban" : "Ban"}
              </button>
              <button
                className="btn btn-secondary btn-sm td-del"
                disabled={pending}
                onClick={() =>
                  act(() => deleteUser(row.id), {
                    title: "Delete this user?",
                    body: <>{row.email} and all their data will be permanently deleted. This can’t be undone.</>,
                    confirmLabel: "Delete user",
                    danger: true,
                  })
                }
              >
                Delete user
              </button>
            </div>
          </>
        )}
        {msg && (
          <p className={msg.ok ? "st-ok" : "form-err"} role={msg.ok ? "status" : "alert"}>
            {msg.text}
          </p>
        )}
      </div>
    </Modal>
  );
}

function Invite({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <Modal label="Invite a user" onClose={onClose} size="sm">
      <form
        className="td"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const r = await inviteUser(email);
            setMsg(r.ok ? { ok: true, text: r.message ?? "Sent." } : { ok: false, text: r.error });
            if (r.ok) setEmail("");
          });
        }}
      >
        <div className="td-head">
          <h2 className="h3">Invite a user</h2>
          <button type="button" className="ne-btn" aria-label="Close" onClick={onClose}>
            <FA icon={faXmark} />
          </button>
        </div>
        <p className="meta">They’ll get an email with a link to set a password and join.</p>
        <input
          className="tf-title adm-in"
          type="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          aria-label="Email address"
        />
        {msg && (
          <p className={msg.ok ? "st-ok" : "form-err"} role={msg.ok ? "status" : "alert"}>
            {msg.text}
          </p>
        )}
        <div className="tf-acts">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary btn-sm" disabled={pending || !email.trim()}>
            {pending ? "Sending…" : "Send invite"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function UsersTable({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  const filters: [Filter, string, number][] = [
    ["all", "All", rows.length],
    ["admin", "Admins", rows.filter((r) => r.admin).length],
    ["pro", "Pro", rows.filter((r) => r.plan === "pro").length],
    ["unconfirmed", "Unconfirmed", rows.filter((r) => !r.confirmed).length],
    ["banned", "Banned", rows.filter((r) => r.banned).length],
  ];

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    const out = rows.filter(
      (r) =>
        (!t || `${r.name} ${r.email}`.toLowerCase().includes(t)) &&
        (filter === "all" ||
          (filter === "admin" ? r.admin : filter === "pro" ? r.plan === "pro" : filter === "banned" ? r.banned : !r.confirmed)),
    );
    const by: Record<Sort, (a: Row, b: Row) => number> = {
      newest: (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
      oldest: (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt),
      seen: (a, b) => +new Date(b.lastSignIn ?? 0) - +new Date(a.lastSignIn ?? 0),
      name: (a, b) => (a.name || a.email).localeCompare(b.name || b.email),
    };
    return out.sort(by[sort]);
  }, [rows, q, filter, sort]);

  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const cur = Math.min(page, pages - 1);
  const shown = list.slice(cur * PAGE, cur * PAGE + PAGE);
  const open = rows.find((r) => r.id === openId) ?? null;

  function exportCsv() {
    const cols = ["name", "email", "provider", "plan", "confirmed", "admin", "banned", "createdAt", "lastSignIn"] as const;
    const text = [cols.join(","), ...list.map((r) => cols.map((c) => csv(r[c])).join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
    a.download = "users.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <>
      {inviting && <Invite onClose={() => setInviting(false)} />}
      {open && <UserDrawer key={open.id} row={open} onClose={() => setOpenId(null)} />}

      <div className="adm-bar">
        <label className="nt-search">
          <FA icon={faMagnifyingGlass} />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
            placeholder="Search name or email…"
            aria-label="Search users"
          />
        </label>
        <label className="tv-select">
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort users">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="seen">Last seen</option>
            <option value="name">Name A–Z</option>
          </select>
        </label>
        <button className="btn btn-secondary btn-sm" onClick={exportCsv}>
          <FA icon={faDownload} /> CSV
        </button>
        <button className="btn btn-primary btn-sm" onClick={() => setInviting(true)}>
          <FA icon={faUserPlus} /> Invite
        </button>
      </div>
      <div className="adm-filters" role="group" aria-label="Filter users">
        {filters.map(([k, l, n]) => (
          <button
            key={k}
            data-on={filter === k}
            aria-pressed={filter === k}
            onClick={() => {
              setFilter(k);
              setPage(0);
            }}
          >
            {l} <em>{n}</em>
          </button>
        ))}
      </div>

      <div className="dash-table">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Sign-in</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Last seen</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr
                key={r.id}
                className="adm-row"
                tabIndex={0}
                onClick={() => setOpenId(r.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setOpenId(r.id);
                }}
              >
                <td>
                  <b>{r.name || "—"}</b>
                  <br />
                  <span className="meta">{r.email}</span>
                </td>
                <td>{r.provider}</td>
                <td>
                  <Pills r={r} />
                </td>
                <td>{fmt(r.createdAt)}</td>
                <td>{fmt(r.lastSignIn)}</td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={5} className="empty">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="adm-pager">
        <small>
          {list.length} {list.length === 1 ? "user" : "users"}
          {list.length ? ` · showing ${cur * PAGE + 1}–${Math.min(list.length, cur * PAGE + PAGE)}` : ""}
        </small>
        <span>
          <button className="ne-btn" aria-label="Previous page" disabled={cur === 0} onClick={() => setPage(cur - 1)}>
            <FA icon={faChevronLeft} />
          </button>
          <small>
            Page {cur + 1} of {pages}
          </small>
          <button className="ne-btn" aria-label="Next page" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>
            <FA icon={faChevronRight} />
          </button>
        </span>
      </div>
    </>
  );
}
