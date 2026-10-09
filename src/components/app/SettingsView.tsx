"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBroom,
  faCircleCheck,
  faDatabase,
  faDownload,
  faEye,
  faEyeSlash,
  faFileLines,
  faImage,
  faPalette,
  faRightFromBracket,
  faShieldHalved,
  faSliders,
  faSpinner,
  faTable,
  faTrash,
  faTriangleExclamation,
  faUser,
  faUserShield,
} from "@fortawesome/free-solid-svg-icons";
import { api } from "../../lib/api/client";
import { authClient } from "../../lib/auth/client";
import { clearDrafts } from "../../lib/drafts";
import { EMAIL_RE } from "../../lib/validate";
import { CATEGORIES } from "../../lib/notes";
import { writePrefs, type Prefs } from "../../lib/prefs";
import { deleteMyAccount } from "../../app/dashboard/settings/actions";
import { useConfirm } from "../ui/Confirm";
import GiftCard, { saveGiftCard } from "./GiftCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/Tabs";

type Tab = "profile" | "prefs" | "appearance" | "security" | "data" | "danger";
const NAV: { k: Tab; label: string; icon: IconDefinition }[] = [
  { k: "profile", label: "Profile", icon: faUser },
  { k: "prefs", label: "Preferences", icon: faSliders },
  { k: "appearance", label: "Appearance", icon: faPalette },
  { k: "security", label: "Security", icon: faShieldHalved },
  { k: "data", label: "Your data", icon: faDatabase },
  { k: "danger", label: "Danger zone", icon: faTrash },
];

type Account = {
  name: string;
  email: string;
  username: string | null;
  displayUsername: string | null;
  hasPassword: boolean;
  providers: string[];
  createdAt: string;
  avatarUrl: string | null;
  lastSignIn: string | null;
};

const csv = (v: unknown) => {
  let s = Array.isArray(v) ? v.join("; ") : String(v ?? "");
  if (/^[=+\-@]/.test(s)) s = "'" + s; // keep spreadsheets from running a cell as a formula
  return `"${s.replace(/"/g, '""')}"`;
};
const download = (name: string, text: string, type: string) => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
};
type Msg = { ok: boolean; text: string } | null;

function Status({ m }: { m: Msg }) {
  if (!m) return null;
  return (
    <p className={m.ok ? "st-ok" : "form-err"} role={m.ok ? "status" : "alert"}>
      <FA icon={m.ok ? faCircleCheck : faTriangleExclamation} /> {m.text}
    </p>
  );
}

const friendly = (m: string) =>
  /same password|different from the old/i.test(m)
    ? "Choose a password you haven’t used before."
    : /rate limit|too many/i.test(m)
      ? "Too many attempts. Please wait a minute and try again."
      : /recently|reauth/i.test(m)
        ? "For security, please log out and back in, then try again."
        : m;

export default function SettingsView({ account, prefs: initial }: { account: Account; prefs: Prefs }) {
  const sb = useMemo(api, []);
  const router = useRouter();
  const { ask, dialog } = useConfirm();

  const [name, setName] = useState(account.name);
  const [nameMsg, setNameMsg] = useState<Msg>(null);
  const [email, setEmail] = useState(account.email);
  const [emailMsg, setEmailMsg] = useState<Msg>(null);
  const [username, setUsername] = useState(account.displayUsername || account.username || "");
  const [usernameMsg, setUsernameMsg] = useState<Msg>(null);
  const [prefs, setPrefs] = useState(initial);
  const [prefMsg, setPrefMsg] = useState<Msg>(null);
  const [oldPw, setOldPw] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [pwMsg, setPwMsg] = useState<Msg>(null);
  const [passkeyName, setPasskeyName] = useState("");
  const [passkeyMsg, setPasskeyMsg] = useState<Msg>(null);
  const [passkeys, setPasskeys] = useState<{ id: string; name?: string; createdAt: Date | string }[]>([]);
  const [sessMsg, setSessMsg] = useState<Msg>(null);
  const [dataMsg, setDataMsg] = useState<Msg>(null);
  const [typed, setTyped] = useState("");
  const [delMsg, setDelMsg] = useState<Msg>(null);
  const [busy, setBusy] = useState("");
  const [tab, setTab] = useState<Tab>("profile");
  const [avatar, setAvatar] = useState(account.avatarUrl);
  const [avatarMsg, setAvatarMsg] = useState<Msg>(null);
  const [resetTyped, setResetTyped] = useState("");
  const [resetMsg, setResetMsg] = useState<Msg>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const main = useRef<HTMLDivElement>(null);
  // Each section starts at the top, not wherever the previous one was scrolled to.
  useEffect(() => {
    main.current?.scrollTo({ top: 0 });
  }, [tab]);

  useEffect(() => {
    if (tab !== "security") return;
    let live = true;
    void authClient
      .$fetch("/passkey/list-user-passkeys", { method: "GET" })
      .then(({ data, error }) => {
        if (live && !error && Array.isArray(data)) setPasskeys(data as typeof passkeys);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [tab]);

  const avatarPath = (url: string | null) => (url ? (url.split("/avatars/")[1]?.split("?")[0] ?? null) : null);

  const uploadAvatar = (f: File) =>
    run("avatar", async () => {
      setAvatarMsg(null);
      if (!/^image\/(png|jpe?g|webp|gif)$/.test(f.type)) return setAvatarMsg({ ok: false, text: "Choose a PNG, JPG, WebP or GIF image." });
      if (f.size > 2 * 1024 * 1024) return setAvatarMsg({ ok: false, text: "Pictures can be up to 2 MB." });
      const { data: u } = await sb.auth.getUser();
      if (!u.user) return;
      const path = `${u.user.id}/avatar-${Date.now()}.${f.type.split("/")[1].replace("jpeg", "jpg")}`;
      const { error } = await sb.storage.from("avatars").upload(path, f, { contentType: f.type });
      if (error) return setAvatarMsg({ ok: false, text: "Couldn’t upload that picture." });
      const url = sb.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      const { error: e2 } = await authClient.updateUser({ image: url });
      if (e2) return setAvatarMsg({ ok: false, text: friendly(e2.message ?? "") });
      const old = avatarPath(avatar);
      if (old) await sb.storage.from("avatars").remove([old]);
      setAvatar(url);
      setAvatarMsg({ ok: true, text: "Picture updated." });
      router.refresh();
    });

  const removeAvatar = () =>
    run("avatar", async () => {
      const old = avatarPath(avatar);
      const { error } = await authClient.updateUser({ image: null });
      if (error) return setAvatarMsg({ ok: false, text: friendly(error.message ?? "") });
      if (old) await sb.storage.from("avatars").remove([old]);
      setAvatar(null);
      setAvatarMsg({ ok: true, text: "Picture removed." });
      router.refresh();
    });

  const exportTasksCsv = () =>
    run("csv", async () => {
      const { data, error } = await sb
        .from("tasks")
        .select("title,description,priority,due_date,done,cancelled,archived,recurrence,created_at")
        .order("created_at")
        .limit(20000);
      if (error) return setDataMsg({ ok: false, text: "Couldn’t export your tasks." });
      const cols = ["title", "description", "priority", "due_date", "done", "cancelled", "archived", "recurrence", "created_at"];
      download(
        "tasks.csv",
        [cols.join(","), ...(data ?? []).map((r) => cols.map((c) => csv((r as Record<string, unknown>)[c])).join(","))].join("\n"),
        "text/csv",
      );
      setDataMsg({ ok: true, text: `Exported ${data?.length ?? 0} tasks.` });
    });

  const exportNotesMd = () =>
    run("md", async () => {
      const { data, error } = await sb
        .from("notes")
        .select("title,body,category,updated_at")
        .order("updated_at", { ascending: false })
        .limit(20000);
      if (error) return setDataMsg({ ok: false, text: "Couldn’t export your notes." });
      const md = (data ?? [])
        .map((n) => `# ${n.title || "Untitled"}\n\n_${n.category} · ${new Date(n.updated_at).toLocaleDateString()}_\n\n${n.body}\n`)
        .join("\n---\n\n");
      download("notes.md", md || "No notes yet.\n", "text/markdown");
      setDataMsg({ ok: true, text: `Exported ${data?.length ?? 0} notes.` });
    });

  /** Delete every file under one of the user's storage folders, however deeply nested. */
  const wipe = (bucket: string, prefix: string) => sb.storage.from(bucket).removeFolder(prefix);

  const resetWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    const yes = await ask({
      title: "Reset your workspace?",
      body: "All your notes, tasks, lists, journal entries, chats and files will be permanently deleted. Your account stays.",
      confirmLabel: "Delete everything",
      danger: true,
    });
    if (!yes) return;
    await run("reset", async () => {
      const { data: u } = await sb.auth.getUser();
      if (!u.user) return;
      const results = await Promise.all([
        sb.from("tasks").delete().not("id", "is", null),
        sb.from("task_lists").delete().not("id", "is", null),
        sb.from("notes").delete().not("id", "is", null),
        sb.from("journal_entries").delete().not("id", "is", null),
        sb.from("chats").delete().not("id", "is", null),
      ]);
      await wipe("note-files", u.user.id);
      if (results.some((r) => r.error)) return setResetMsg({ ok: false, text: "Some items couldn’t be deleted. Please try again." });
      setResetTyped("");
      setResetMsg({ ok: true, text: "Your workspace is empty again." });
      router.refresh();
    });
  };

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try {
      await fn();
    } finally {
      setBusy("");
    }
  };

  const saveName = (e: React.FormEvent) => {
    e.preventDefault();
    const v = name.trim();
    if (!v) return setNameMsg({ ok: false, text: "Please enter your name." });
    run("name", async () => {
      const { error } = await authClient.updateUser({ name: v });
      setNameMsg(error ? { ok: false, text: friendly(error.message ?? "") } : { ok: true, text: "Name updated." });
      if (!error) router.refresh();
    });
  };

  const saveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const v = email.trim().toLowerCase();
    if (!EMAIL_RE.test(v)) return setEmailMsg({ ok: false, text: "Please enter a valid email address." });
    if (v === account.email.toLowerCase()) return setEmailMsg({ ok: false, text: "That’s already your email." });
    run("email", async () => {
      const { error } = await authClient.changeEmail({ newEmail: v, callbackURL: "/dashboard" });
      setEmailMsg(
        error
          ? { ok: false, text: friendly(error.message ?? "") }
          : { ok: true, text: "Check your inbox — confirm the change from the link we sent. Your email stays the same until you do." },
      );
    });
  };

  const saveUsername = (e: React.FormEvent) => {
    e.preventDefault();
    const v = username.trim();
    if (!/^[A-Za-z0-9_.]{3,30}$/.test(v)) {
      setUsernameMsg({ ok: false, text: "Use 3–30 letters, numbers, dots or underscores." });
      return;
    }
    if (v.toLowerCase() === (account.username || "").toLowerCase() && v === (account.displayUsername || account.username)) {
      setUsernameMsg({ ok: false, text: "That’s already your username." });
      return;
    }
    run("username", async () => {
      const { error } = await authClient.updateUser({ username: v, displayUsername: v });
      setUsernameMsg(
        error ? { ok: false, text: friendly(error.message ?? "Couldn’t update your username.") } : { ok: true, text: "Username updated." },
      );
      if (!error) router.refresh();
    });
  };

  const changePref = async (patch: Partial<Prefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    writePrefs(next);
    const { error } = await sb.from("profiles").upsert({ preferences: next }, { onConflict: "user_id" });
    setPrefMsg(error ? { ok: false, text: "Couldn’t save that preference." } : { ok: true, text: "Saved." });
    if (!error) router.refresh();
  };

  const savePw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPw) return setPwMsg({ ok: false, text: "Enter your current password." });
    if (pw.length < 8) return setPwMsg({ ok: false, text: "Your password needs at least 8 characters." });
    if (pw !== pw2) return setPwMsg({ ok: false, text: "The two passwords don’t match." });
    run("pw", async () => {
      const { error } = await authClient.changePassword({ currentPassword: oldPw, newPassword: pw, revokeOtherSessions: true });
      if (error)
        return setPwMsg({
          ok: false,
          text: /invalid/i.test(error.message ?? "") ? "Your current password isn’t right." : friendly(error.message ?? ""),
        });
      setOldPw("");
      setPw("");
      setPw2("");
      setPwMsg({ ok: true, text: "Password updated." });
    });
  };

  const addPasskey = () =>
    run("passkey", async () => {
      setPasskeyMsg(null);
      const { error } = await authClient.passkey.addPasskey({ name: passkeyName.trim() || undefined });
      if (error) return setPasskeyMsg({ ok: false, text: friendly(error.message ?? "Couldn’t add a passkey.") });
      setPasskeyName("");
      setPasskeyMsg({ ok: true, text: "Passkey added to your account." });
      const result = await authClient.$fetch("/passkey/list-user-passkeys", { method: "GET" });
      if (!result.error && Array.isArray(result.data)) setPasskeys(result.data as typeof passkeys);
    });

  const removePasskey = (id: string) =>
    run(`passkey-${id}`, async () => {
      setPasskeyMsg(null);
      const { error } = await authClient.$fetch("/passkey/delete-passkey", { method: "POST", body: { id } });
      if (error) return setPasskeyMsg({ ok: false, text: friendly(error.message ?? "Couldn’t remove that passkey.") });
      setPasskeys((current) => current.filter((passkey) => passkey.id !== id));
      setPasskeyMsg({ ok: true, text: "Passkey removed." });
    });

  const signOutOthers = () =>
    run("others", async () => {
      const { error } = await authClient.revokeOtherSessions();
      setSessMsg(error ? { ok: false, text: friendly(error.message ?? "") } : { ok: true, text: "Signed out of all your other devices." });
    });

  const signOutEverywhere = async () => {
    const yes = await ask({
      title: "Sign out everywhere?",
      body: "You’ll be signed out on this device and every other device. You can log back in any time.",
      confirmLabel: "Sign out everywhere",
    });
    if (!yes) return;
    await run("global", async () => {
      await authClient.revokeSessions();
      await clearDrafts();
      await authClient.signOut();
      router.push("/login");
      router.refresh();
    });
  };

  const exportData = () =>
    run("export", async () => {
      setDataMsg(null);
      const get = async (t: string, cols = "*") => {
        const { data, error } = await sb.from(t).select(cols).limit(10000);
        if (error) throw error;
        return data;
      };
      try {
        const out = {
          exportedAt: new Date().toISOString(),
          account: { email: account.email, name: account.name },
          tasks: await get("tasks"),
          journal: await get("journal_entries"),
          notes: await get("notes"),
          chats: await get("chats"),
          chatMessages: await get("chat_messages"),
        };
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: "application/json" }));
        a.download = `untitled-project-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
        setDataMsg({ ok: true, text: "Your data was downloaded." });
      } catch {
        setDataMsg({ ok: false, text: "Couldn’t export your data. Please try again." });
      }
    });

  const deleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const yes = await ask({
      title: "Delete your account?",
      body: "Your notes, journal, tasks, chats and files will be permanently deleted. This can’t be undone.",
      confirmLabel: "Delete my account",
      danger: true,
    });
    if (!yes) return;
    await run("delete", async () => {
      const r = await deleteMyAccount(typed);
      if (!r.ok) return setDelMsg({ ok: false, text: r.error });
      await clearDrafts();
      await authClient.signOut();
      router.push("/");
      router.refresh();
    });
  };

  const since = new Date(account.createdAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  const spin = (k: string, label: string) =>
    busy === k ? (
      <>
        <FA icon={faSpinner} spin /> Please wait…
      </>
    ) : (
      label
    );

  return (
    <Tabs orientation="vertical" value={tab} onValueChange={(v) => setTab(v as Tab)} className="st st-layout">
      {dialog}
      <nav className="st-nav" aria-label="Settings">
        <TabsList className="st-tabs" aria-label="Settings sections">
          {NAV.map(({ k, label, icon }) => (
            <TabsTrigger key={k} value={k} data-danger={k === "danger"}>
              <FA icon={icon} /> <span>{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="st-nav-foot">
          <b>{account.name || account.email.split("@")[0]}</b>
          <small>{account.email}</small>
          <small>Member since {since}</small>
        </div>
      </nav>
      <div className="st-main" ref={main}>
        <TabsContent value="profile" forceMount asChild>
          <section className="ap-card at-violet" aria-labelledby="st-profile">
            <div className="ap-card-h">
              <span id="st-profile">Profile</span>
            </div>
            <div className="st-body">
              <div className="st-avatar">
                <span className="st-avatar-pic" aria-hidden>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {avatar ? <img src={avatar} alt="" /> : (account.name || account.email)[0]?.toUpperCase()}
                </span>
                <div>
                  <b>Profile picture</b>
                  <small>PNG, JPG, WebP or GIF, up to 2 MB.</small>
                  <div className="st-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={busy === "avatar"}
                      onClick={() => fileInput.current?.click()}
                    >
                      {busy === "avatar" ? (
                        <>
                          <FA icon={faSpinner} spin /> Uploading…
                        </>
                      ) : (
                        <>
                          <FA icon={faImage} /> {avatar ? "Change" : "Upload"}
                        </>
                      )}
                    </button>
                    {avatar && (
                      <button type="button" className="btn btn-secondary btn-sm" disabled={busy === "avatar"} onClick={removeAvatar}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadAvatar(f);
                    e.target.value = "";
                  }}
                />
              </div>
              <Status m={avatarMsg} />
              <hr className="st-hr" />
              <form className="st-row" onSubmit={saveName}>
                <label>
                  <span>Full name</span>
                  <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" />
                </label>
                <button className="btn btn-primary btn-sm" disabled={busy === "name" || name.trim() === account.name}>
                  {spin("name", "Save name")}
                </button>
              </form>
              <Status m={nameMsg} />
              <form className="st-row" onSubmit={saveUsername}>
                <label>
                  <span>Username</span>
                  <input
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    minLength={3}
                    maxLength={30}
                    pattern="[A-Za-z0-9_.]{3,30}"
                    autoComplete="username"
                    placeholder="ada.lovelace"
                  />
                  <small className="meta">Use 3–30 letters, numbers, dots or underscores. You can log in with this or your email.</small>
                </label>
                <button
                  className="btn btn-primary btn-sm"
                  disabled={busy === "username" || (username === (account.displayUsername || account.username || "") && !!account.username)}
                >
                  {spin("username", "Save username")}
                </button>
              </form>
              <Status m={usernameMsg} />
              <form className="st-row" onSubmit={saveEmail}>
                <label>
                  <span>Email</span>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} autoComplete="email" />
                </label>
                <button
                  className="btn btn-primary btn-sm"
                  disabled={busy === "email" || email.trim().toLowerCase() === account.email.toLowerCase()}
                >
                  {spin("email", "Change email")}
                </button>
              </form>
              <Status m={emailMsg} />
              <p className="meta">
                Sign-in method:{" "}
                {account.providers.map((p) => (p === "email" ? "Email & password" : p[0].toUpperCase() + p.slice(1))).join(", ")}
              </p>
              <div className="st-gift" style={{ display: "grid", justifyItems: "start", gap: 12, paddingTop: 18, borderTop: "1px solid var(--line)" }}>
                <b id="st-gift">Welcome gift card</b>
                <p className="meta">Your card, with your name engraved on it. Download it any time.</p>
                <GiftCard name={account.name || account.email} />
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => void saveGiftCard(account.name || account.email)}>
                  <FA icon={faDownload} /> Download card
                </button>
              </div>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="prefs" forceMount asChild>
          <section className="ap-card at-blue" aria-labelledby="st-prefs">
            <div className="ap-card-h">
              <span id="st-prefs">Preferences</span>
            </div>
            <div className="st-body">
              <label className="st-field">
                <span>Time format</span>
                <select value={prefs.timeFormat} onChange={(e) => changePref({ timeFormat: e.target.value as Prefs["timeFormat"] })}>
                  <option value="12h">12-hour (9:46 pm)</option>
                  <option value="24h">24-hour (21:46)</option>
                </select>
              </label>
              <label className="st-field">
                <span>Default category for new notes</span>
                <select value={prefs.defaultCategory} onChange={(e) => changePref({ defaultCategory: e.target.value })}>
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="st-field">
                <span>Week starts on</span>
                <select value={prefs.weekStart} onChange={(e) => changePref({ weekStart: e.target.value as Prefs["weekStart"] })}>
                  <option value="mon">Monday</option>
                  <option value="sun">Sunday</option>
                </select>
              </label>
              <label className="st-field">
                <span>Open the To-do page on</span>
                <select value={prefs.todoView} onChange={(e) => changePref({ todoView: e.target.value as Prefs["todoView"] })}>
                  <option value="today">Today</option>
                  <option value="inbox">Inbox</option>
                  <option value="upcoming">Upcoming</option>
                </select>
              </label>
              <Status m={prefMsg} />
            </div>
          </section>
        </TabsContent>

        <TabsContent value="appearance" forceMount asChild>
          <section className="ap-card at-violet" aria-labelledby="st-look">
            <div className="ap-card-h">
              <span id="st-look">Appearance</span>
            </div>
            <div className="st-body">
              <div className="st-field">
                <span id="st-density">Density</span>
                <div className="st-seg" role="radiogroup" aria-labelledby="st-density">
                  {(
                    [
                      ["comfortable", "Comfortable"],
                      ["compact", "Compact"],
                    ] as const
                  ).map(([k, l]) => (
                    <button
                      key={k}
                      type="button"
                      role="radio"
                      aria-checked={prefs.density === k}
                      data-on={prefs.density === k}
                      onClick={() => changePref({ density: k })}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <small className="meta">Compact fits more tasks, notes and entries on screen.</small>
              </div>
              <div className="st-switch">
                <div>
                  <b id="st-motion">Reduce motion</b>
                  <small>Turns off animations and transitions across the app.</small>
                </div>
                <button
                  role="switch"
                  aria-checked={prefs.reduceMotion}
                  aria-labelledby="st-motion"
                  data-on={prefs.reduceMotion}
                  onClick={() => changePref({ reduceMotion: !prefs.reduceMotion })}
                >
                  <i />
                </button>
              </div>
              <Status m={prefMsg} />
            </div>
          </section>
        </TabsContent>

        <TabsContent value="security" forceMount asChild>
          <section className="ap-card at-mint" aria-labelledby="st-security">
            <div className="ap-card-h">
              <span id="st-security">
                <FA icon={faUserShield} /> Security
              </span>
            </div>
            <div className="st-body">
              {account.hasPassword ? (
                <form className="st-stack" onSubmit={savePw}>
                  <label>
                    <span>Current password</span>
                    <input
                      type={show ? "text" : "password"}
                      value={oldPw}
                      onChange={(e) => setOldPw(e.target.value)}
                      autoComplete="current-password"
                    />
                  </label>
                  <div className="st-two">
                    <label>
                      <span>New password</span>
                      <span className="au-pw">
                        <input
                          type={show ? "text" : "password"}
                          value={pw}
                          onChange={(e) => setPw(e.target.value)}
                          autoComplete="new-password"
                          placeholder="At least 8 characters"
                        />
                        <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)}>
                          <FA icon={show ? faEyeSlash : faEye} />
                        </button>
                      </span>
                    </label>
                    <label>
                      <span>Confirm password</span>
                      <input
                        type={show ? "text" : "password"}
                        value={pw2}
                        onChange={(e) => setPw2(e.target.value)}
                        autoComplete="new-password"
                      />
                    </label>
                  </div>
                  <button className="btn btn-primary btn-sm st-fit" disabled={busy === "pw" || !pw}>
                    {spin("pw", "Update password")}
                  </button>
                  <Status m={pwMsg} />
                </form>
              ) : (
                <p className="body">You sign in with {account.providers.join(", ")}, so there’s no password to manage here.</p>
              )}
              <hr className="st-hr" />
              <div className="st-stack">
                <div>
                  <b>Passkeys</b>
                  <p className="meta">Use Face ID, Touch ID, Windows Hello or a security key to sign in.</p>
                </div>
                {passkeys.map((passkey) => (
                  <div className="st-passkey-row" key={passkey.id}>
                    <div className="st-passkey-info">
                      <b className="st-passkey-name">{passkey.name || "Passkey"}</b>
                      <small>Added {new Date(passkey.createdAt).toLocaleDateString()}</small>
                    </div>
                    <button
                      className="btn btn-secondary st-passkey-remove"
                      type="button"
                      disabled={busy === `passkey-${passkey.id}`}
                      onClick={() => removePasskey(passkey.id)}
                    >
                      {spin(`passkey-${passkey.id}`, "Remove")}
                    </button>
                  </div>
                ))}
                <label>
                  <span>Passkey name (optional)</span>
                  <input
                    value={passkeyName}
                    onChange={(event) => setPasskeyName(event.target.value)}
                    maxLength={100}
                    placeholder="e.g. My laptop"
                  />
                </label>
                <button className="btn btn-primary btn-sm st-fit" type="button" disabled={busy === "passkey"} onClick={addPasskey}>
                  {spin("passkey", "Add a passkey")}
                </button>
                <Status m={passkeyMsg} />
              </div>
              <hr className="st-hr" />
              <dl className="st-facts">
                <div>
                  <dt>Last sign-in</dt>
                  <dd>
                    {account.lastSignIn
                      ? new Date(account.lastSignIn).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt>Account created</dt>
                  <dd>{since}</dd>
                </div>
                <div>
                  <dt>Sign-in methods</dt>
                  <dd>{account.providers.map((p) => (p === "email" ? "Email & password" : p[0].toUpperCase() + p.slice(1))).join(", ")}</dd>
                </div>
              </dl>
              <div className="st-actions">
                <button className="btn btn-secondary btn-sm" onClick={signOutOthers} disabled={busy === "others"}>
                  {spin("others", "Sign out other devices")}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={signOutEverywhere} disabled={busy === "global"}>
                  <FA icon={faRightFromBracket} /> Sign out everywhere
                </button>
              </div>
              <Status m={sessMsg} />
            </div>
          </section>
        </TabsContent>

        <TabsContent value="data" forceMount asChild>
          <section className="ap-card at-amber" aria-labelledby="st-data">
            <div className="ap-card-h">
              <span id="st-data">Your data</span>
            </div>
            <div className="st-body">
              <p className="body">Download everything you’ve saved — tasks, journal, notes and chats — as one JSON file.</p>
              <div className="st-actions">
                <button className="btn btn-secondary btn-sm" onClick={exportData} disabled={busy === "export"}>
                  {busy === "export" ? (
                    <>
                      <FA icon={faSpinner} spin /> Preparing…
                    </>
                  ) : (
                    <>
                      <FA icon={faDownload} /> Everything (JSON)
                    </>
                  )}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={exportTasksCsv} disabled={busy === "csv"}>
                  {busy === "csv" ? (
                    <>
                      <FA icon={faSpinner} spin /> Preparing…
                    </>
                  ) : (
                    <>
                      <FA icon={faTable} /> Tasks (CSV)
                    </>
                  )}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={exportNotesMd} disabled={busy === "md"}>
                  {busy === "md" ? (
                    <>
                      <FA icon={faSpinner} spin /> Preparing…
                    </>
                  ) : (
                    <>
                      <FA icon={faFileLines} /> Notes (Markdown)
                    </>
                  )}
                </button>
              </div>
              <Status m={dataMsg} />
            </div>
          </section>
        </TabsContent>

        <TabsContent value="danger" forceMount asChild>
          <section className="ap-card at-gold" aria-labelledby="st-reset">
            <div className="ap-card-h">
              <span id="st-reset">
                <FA icon={faBroom} /> Reset workspace
              </span>
            </div>
            <form className="st-body" onSubmit={resetWorkspace}>
              <p className="body">
                Start fresh without losing your account. This permanently deletes all your notes, tasks, lists, journal entries, chats and
                attached files.
              </p>
              <label className="st-field">
                <span>
                  Type <b>reset</b> to confirm
                </span>
                <input
                  value={resetTyped}
                  onChange={(e) => setResetTyped(e.target.value)}
                  autoComplete="off"
                  aria-label="Type reset to confirm"
                />
              </label>
              <button
                className="btn btn-primary btn-sm st-fit st-danger"
                disabled={busy === "reset" || resetTyped.trim().toLowerCase() !== "reset"}
              >
                {spin("reset", "Delete all my content")}
              </button>
              <Status m={resetMsg} />
            </form>
          </section>
        </TabsContent>

        <TabsContent value="danger" forceMount asChild>
          <section className="ap-card at-clay" aria-labelledby="st-danger">
            <div className="ap-card-h">
              <span id="st-danger">Delete account</span>
            </div>
            <form className="st-body" onSubmit={deleteAccount}>
              <p className="body">This permanently deletes your account and everything in it. Export your data first if you want a copy.</p>
              <label className="st-field">
                <span>
                  Type <b>{account.email}</b> to confirm
                </span>
                <input
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  autoComplete="off"
                  aria-label="Type your email to confirm"
                />
              </label>
              <button
                className="btn btn-primary btn-sm st-fit st-danger"
                disabled={busy === "delete" || typed.trim().toLowerCase() !== account.email.toLowerCase()}
              >
                {spin("delete", "Delete my account")}
              </button>
              <Status m={delMsg} />
            </form>
          </section>
        </TabsContent>
      </div>
    </Tabs>
  );
}
