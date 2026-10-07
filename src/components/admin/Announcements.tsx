"use client";
import { useState, useTransition } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faTrash } from "@fortawesome/free-solid-svg-icons";
import { createAnnouncement, deleteAnnouncement, toggleAnnouncement } from "../../app/admin/actions";
import { useConfirm } from "../app/Confirm";

export type Announcement = { id: string; message: string; tone: string; active: boolean; created_at: string };
const TONES: [string, string][] = [["info", "Info"], ["success", "Good news"], ["warning", "Heads-up"]];

export default function Announcements({ items }: { items: Announcement[] }) {
  const { ask, dialog } = useConfirm();
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState("info");
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => start(async () => { setErr(""); const r = await fn(); if (!r.ok) setErr(r.error ?? "Something went wrong."); });

  return (
    <>
      {dialog}
      <form className="dash-card at-violet adm-compose" onSubmit={(e) => { e.preventDefault(); run(async () => { const r = await createAnnouncement(message, tone); if (r.ok) setMessage(""); return r; }); }}>
        <h4>New announcement</h4>
        <p className="meta">Shown as a banner at the top of the app for every signed-in user. They can dismiss it.</p>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} rows={3} placeholder="e.g. Scheduled maintenance tonight at 11 pm." aria-label="Announcement message" />
        <div className="adm-compose-row">
          <div className="st-seg" role="radiogroup" aria-label="Tone">
            {TONES.map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={tone === k} data-on={tone === k} onClick={() => setTone(k)}>{l}</button>)}
          </div>
          <small className="meta">{message.length}/500</small>
          <button className="btn btn-primary btn-sm" disabled={pending || !message.trim()}>Publish</button>
        </div>
        {err && <p className="form-err" role="alert">{err}</p>}
      </form>

      <div className="adm-ann">
        {items.length === 0 && <p className="meta">No announcements yet.</p>}
        {items.map((a) => (
          <article key={a.id} className="ann" data-tone={a.tone} data-active={a.active}>
            <div>
              <p>{a.message}</p>
              <small>{new Date(a.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })} · {a.active ? "Showing to users" : "Hidden"}</small>
            </div>
            <span>
              <button className="icon-btn" disabled={pending} aria-label={a.active ? "Hide announcement" : "Show announcement"} title={a.active ? "Hide" : "Show"} onClick={() => run(() => toggleAnnouncement(a.id, !a.active))}><FA icon={a.active ? faEyeSlash : faEye} /></button>
              <button className="icon-btn" disabled={pending} aria-label="Delete announcement" title="Delete" onClick={() => start(async () => {
                if (await ask({ title: "Delete this announcement?", body: "It will disappear for everyone.", confirmLabel: "Delete", danger: true })) { setErr(""); const r = await deleteAnnouncement(a.id); if (!r.ok) setErr(r.error); }
              })}><FA icon={faTrash} /></button>
            </span>
          </article>
        ))}
      </div>
    </>
  );
}
