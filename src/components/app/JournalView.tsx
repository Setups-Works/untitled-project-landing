"use client";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import {
  faArrowUp,
  faChevronLeft,
  faChevronRight,
  faMicrophone,
  faPaperclip,
  faPen,
  faStop,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api/client";
import { qk } from "../../lib/query/keys";
import { useRealtimeInvalidate } from "../../hooks/useRealtimeInvalidate";
import { addDays, isoDate } from "../../lib/dates";
import { fmtTime } from "../../lib/prefs";
import { safeName } from "../../lib/notes";
import type { Attachment, Entry } from "../../lib/workspace";
import Markdown from "./Markdown";
import JournalCalendar from "./JournalCalendar";
import { useConfirm } from "../ui/Confirm";
import FilePreviewList from "../ui/FilePreviewList";
import AttachmentImage from "../ui/AttachmentImage";
import AudioWave from "../ui/AudioWave";
import { useRecorder } from "./useRecorder";

const COLS = "id,entry_date,body,created_at,updated_at,kind,attachments";
const EMPTY_ENTRIES: Entry[] = []; // stable references while a query loads
const EMPTY_COUNTS: Record<string, number> = {};
const MAX_BYTES = 10 * 1024 * 1024;
const parse = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export default function JournalView() {
  const sb = useMemo(api, []);
  const today = useMemo(() => isoDate(), []);
  const { ask, dialog } = useConfirm();
  const [date, setDate] = useState(today);
  // ?d=YYYY-MM-DD jumps to a day (used by universal search).
  const dParam = useSearchParams().get("d");
  useEffect(() => {
    if (dParam && /^\d{4}-\d{2}-\d{2}$/.test(dParam) && dParam <= today) setDate(dParam);
  }, [dParam, today]);
  const qc = useQueryClient();
  const [err, setErr] = useState("");
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [urls, setUrls] = useState<Record<string, string>>({});
  const uid = useRef("");
  const ta = useRef<HTMLTextAreaElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const end = useRef<HTMLDivElement>(null);

  // Two cached queries: how many entries each day has (calendar dots, day list) and the selected day's entries.
  // Switching back to a day you've already opened is instant; changes elsewhere (another tab) arrive via realtime.
  const countsQ = useQuery({
    queryKey: qk.journal.counts,
    queryFn: async () => {
      const { data, error } = await sb.from("journal_entries").select("entry_date").limit(5000);
      if (error) throw error;
      const c: Record<string, number> = {};
      (data ?? []).forEach((r) => {
        c[r.entry_date as string] = (c[r.entry_date as string] || 0) + 1;
      });
      return c;
    },
  });
  const dayQ = useQuery({
    queryKey: qk.journal.day(date),
    queryFn: async () => {
      const { data, error } = await sb.from("journal_entries").select(COLS).eq("entry_date", date).order("created_at");
      if (error) throw error;
      return data as Entry[];
    },
  });
  const counts = countsQ.data ?? EMPTY_COUNTS;
  const entries = dayQ.data ?? EMPTY_ENTRIES;
  const ready = !dayQ.isPending;
  const loadCounts = useCallback(() => qc.invalidateQueries({ queryKey: qk.journal.counts }), [qc]);
  const loadDay = useCallback(() => qc.invalidateQueries({ queryKey: qk.journal.day(date) }), [qc, date]);
  useRealtimeInvalidate("journal_entries", [qk.journal.all]);
  useEffect(() => {
    setErr(dayQ.isError ? "Couldn’t load your journal." : "");
  }, [dayQ.isError]);

  useEffect(() => {
    sb.auth.getUser().then(({ data }) => {
      uid.current = data.user?.id ?? "";
    });
  }, [sb]);
  useEffect(() => {
    setEditing(null);
  }, [date]);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [entries.length]);

  const paths = entries.flatMap((e) => e.attachments.map((a) => a.path)).join("|");
  useEffect(() => {
    if (!paths) return setUrls({});
    let live = true;
    sb.storage
      .from("note-files")
      .createSignedUrls(paths.split("|"), 3600)
      .then(({ data }) => {
        if (live && data)
          setUrls(Object.fromEntries(data.filter((d) => d.path && d.signedUrl).map((d) => [d.path as string, d.signedUrl as string])));
      });
    return () => {
      live = false;
    };
  }, [sb, paths]);

  const rec = useRecorder((blob, type, secs) => {
    const ext = type.includes("mp4") ? "m4a" : "webm";
    setFiles((f) => [...f, new File([blob], `voice-note-${secs}s.${ext}`, { type })]);
  }, setErr);

  const addFiles = (list: FileList | null) => {
    const ok = Array.from(list ?? []).filter((f) => f.size <= MAX_BYTES);
    if ((list?.length ?? 0) > ok.length) setErr("Files can be up to 10 MB.");
    setFiles((f) => [...f, ...ok]);
  };

  async function send() {
    const body = text.trim();
    if ((!body && !files.length) || busy) return;
    setBusy(true);
    setErr("");
    const voiceOnly = !body && files.every((f) => f.type.startsWith("audio/"));
    const { data, error } = await sb
      .from("journal_entries")
      .insert({ entry_date: date, body, kind: voiceOnly ? "voice" : "text" })
      .select(COLS)
      .single();
    if (error || !data) {
      setErr("Couldn’t save that entry.");
      return setBusy(false);
    }
    if (files.length) {
      const atts: Attachment[] = [];
      for (const f of files) {
        const path = `${uid.current}/journal/${data.id}/${crypto.randomUUID()}-${safeName(f.name)}`;
        const { error: up } = await sb.storage.from("note-files").upload(path, f, { contentType: f.type || "application/octet-stream" });
        if (up) setErr(`Couldn’t upload ${f.name}.`);
        else atts.push({ path, name: f.name, type: f.type || "application/octet-stream", size: f.size });
      }
      if (atts.length) await sb.from("journal_entries").update({ attachments: atts }).eq("id", data.id);
    }
    setText("");
    setFiles([]);
    if (ta.current) ta.current.style.height = "";
    setBusy(false);
    await Promise.all([loadDay(), loadCounts()]);
  }

  async function saveEdit(e: Entry) {
    const body = draft.trim();
    if (!body && !e.attachments.length) return setEditing(null);
    const { error } = await sb.from("journal_entries").update({ body, updated_at: new Date().toISOString() }).eq("id", e.id);
    if (error) return setErr("Couldn’t save that change.");
    setEditing(null);
    loadDay();
  }

  async function remove(e: Entry) {
    const yes = await ask({
      title: "Delete this entry?",
      body: <>The entry from {fmtTime(e.created_at)} and its attachments will be permanently deleted.</>,
      confirmLabel: "Delete entry",
      danger: true,
    });
    if (!yes) return;
    if (e.attachments.length) await sb.storage.from("note-files").remove(e.attachments.map((a) => a.path));
    const { error } = await sb.from("journal_entries").delete().eq("id", e.id);
    if (error) return setErr("Couldn’t delete that entry.");
    await Promise.all([loadDay(), loadCounts()]);
  }

  const days = useMemo(() => {
    const set = new Set([...Object.keys(counts), today, date]);
    return [...set].sort().reverse().slice(0, 120);
  }, [counts, today, date]);

  const d = parse(date);
  const title = d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    ...(d.getFullYear() !== new Date().getFullYear() ? { year: "numeric" } : {}),
  });
  const n = entries.length;
  const canSend = (text.trim() || files.length) && !busy;

  return (
    <div className="jr">
      {dialog}
      <aside className="jr-side ap-card at-sand" aria-label="Journal days">
        <div className="jr-nav">
          <button className="jc-btn" aria-label="Previous day" onClick={() => setDate(addDays(date, -1))}>
            <FA icon={faChevronLeft} />
          </button>
          <JournalCalendar value={date} today={today} counts={counts} onPick={setDate} />
          <button className="jc-btn" aria-label="Next day" disabled={date >= today} onClick={() => setDate(addDays(date, 1))}>
            <FA icon={faChevronRight} />
          </button>
        </div>
        <ul className="jr-days">
          {days.map((iso) => {
            const dd = parse(iso);
            return (
              <li key={iso}>
                <button data-on={iso === date} aria-current={iso === date ? "date" : undefined} onClick={() => setDate(iso)}>
                  <span>
                    <small>{dd.toLocaleDateString(undefined, { weekday: "short" })}</small>
                    <b>{dd.toLocaleDateString(undefined, { day: "numeric", month: "long" })}</b>
                  </span>
                  {counts[iso] > 0 && <em>{counts[iso]}</em>}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className="jr-main ap-card at-violet" aria-label={title}>
        <header className="jr-head">
          <div>
            <h1 className="h3">
              {title} {date === today && <span className="jr-today">Today</span>}
            </h1>
            <small>{ready ? `${n} ${n === 1 ? "entry" : "entries"}` : " "}</small>
          </div>
        </header>

        <div className="jr-list" aria-live="polite">
          {ready && n === 0 && (
            <p className="ap-none jr-empty">
              {date === today ? "Nothing written yet today. What’s on your mind?" : "No entries on this day."}
            </p>
          )}
          {entries.map((e) => (
            <article key={e.id} className="jr-entry">
              <div className="jr-meta">
                <time dateTime={e.created_at}>{fmtTime(e.created_at)}</time>
                <span className="jr-acts">
                  <button
                    className="icon-btn"
                    aria-label="Edit entry"
                    onClick={() => {
                      setEditing(e.id);
                      setDraft(e.body);
                    }}
                  >
                    <FA icon={faPen} />
                  </button>
                  <button className="icon-btn" aria-label="Delete entry" onClick={() => remove(e)}>
                    <FA icon={faTrash} />
                  </button>
                </span>
              </div>
              {editing === e.id ? (
                <div className="jr-edit">
                  <textarea
                    autoFocus
                    value={draft}
                    onChange={(x) => setDraft(x.target.value)}
                    maxLength={50000}
                    aria-label="Edit entry"
                    onKeyDown={(x) => {
                      if ((x.metaKey || x.ctrlKey) && x.key === "Enter") saveEdit(e);
                      if (x.key === "Escape") setEditing(null);
                    }}
                  />
                  <div>
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditing(null)}>
                      Cancel
                    </button>{" "}
                    <button className="btn btn-primary btn-sm" onClick={() => saveEdit(e)}>
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                e.body && <Markdown text={e.body} />
              )}
              {e.attachments.length > 0 && (
                <ul className="jr-files">
                  {e.attachments.map((a) => {
                    const u = urls[a.path];
                    return (
                      <li key={a.path}>
                        {u && a.type.startsWith("image/") && <AttachmentImage src={u} name={a.name} />}
                        {u && a.type.startsWith("audio/") && <AudioWave src={u} label={a.name} />}
                        {!a.type.startsWith("image/") &&
                          !a.type.startsWith("audio/") &&
                          (u ? (
                            <a href={u} target="_blank" rel="noopener noreferrer">
                              <FA icon={faPaperclip} /> {a.name}
                            </a>
                          ) : (
                            <span>{a.name}</span>
                          ))}
                      </li>
                    );
                  })}
                </ul>
              )}
            </article>
          ))}
          <div ref={end} />
        </div>

        {err && (
          <p className="form-err jr-err" role="alert">
            {err}
          </p>
        )}

        <form
          className="jr-compose"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <FilePreviewList label="Attachments to add" files={files} onRemove={(i) => setFiles((x) => x.filter((_, j) => j !== i))} />
          <textarea
            ref={ta}
            value={text}
            rows={2}
            maxLength={50000}
            placeholder="Start writing…"
            aria-label="New journal entry"
            onChange={(e) => {
              setText(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 220)}px`;
            }}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                send();
              }
            }}
          />
          <div className="jr-bar">
            <button type="button" className="jr-pill" onClick={() => file.current?.click()}>
              <FA icon={faPaperclip} /> Attach
            </button>
            <button type="button" className="jr-pill" data-on={rec.recording} aria-pressed={rec.recording} onClick={rec.toggle}>
              <FA icon={rec.recording ? faStop : faMicrophone} />{" "}
              {rec.recording ? `Stop · ${Math.floor(rec.secs / 60)}:${String(rec.secs % 60).padStart(2, "0")}` : "Voice"}
            </button>
            <input
              ref={file}
              type="file"
              multiple
              hidden
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <button className="jr-send" disabled={!canSend} aria-label="Add entry" title="Add entry (⌘ Enter)">
              <FA icon={faArrowUp} />
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
