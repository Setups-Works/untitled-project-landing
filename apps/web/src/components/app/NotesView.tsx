"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faEllipsis,
  faGripVertical,
  faImage,
  faMagnifyingGlass,
  faMicrophone,
  faPaperclip,
  faPlus,
  faStop,
  faThumbtack,
  faTrash,
  faWaveSquare,
} from "@fortawesome/free-solid-svg-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api/client";
import { qk } from "../../lib/query/keys";
import { useRealtimeInvalidate } from "../../hooks/useRealtimeInvalidate";
import { useDraftText } from "../../hooks/useDraft";
import type { Attachment, Note } from "../../lib/workspace";
import { CATEGORIES, NOTE_COLS, displayTitle, editedLabel, safeName, toneOf } from "../../lib/notes";
import Markdown from "./Markdown";
import Menu, { MenuCheckItem, MenuItem, MenuLabel, MenuRadioGroup, MenuRadioItem, MenuSeparator } from "../ui/Menu";
import { useConfirm } from "../ui/Confirm";
import { readPrefs } from "../../lib/prefs";
import NoteEditor from "./NoteEditor";
import { ctxProps, useCtxActions } from "../../lib/context-actions";

type Filter = "all" | "pinned" | "voice";
type Sort = "manual" | "edited" | "title";
const MAX_BYTES = 10 * 1024 * 1024;
const EMPTY_NOTES: Note[] = []; // stable reference while the query loads

export default function NotesView() {
  const sb = useMemo(api, []);
  const router = useRouter();
  const params = useSearchParams();
  const qc = useQueryClient();
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [cats, setCats] = useState<string[]>([]);
  const [withFiles, setWithFiles] = useState(false);
  const [sort, setSort] = useState<Sort>("manual");
  const [cap, setCap] = useDraftText("notes:capture");
  const [recording, setRecording] = useState(false);
  const [secs, setSecs] = useState(0);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const search = useRef<HTMLInputElement>(null);
  const capRef = useRef<HTMLInputElement>(null);
  const img = useRef<HTMLInputElement>(null);
  const uid = useRef<string>("");
  const creating = useRef(false);
  const mr = useRef<MediaRecorder | null>(null);
  const { ask, dialog } = useConfirm();

  const openId = params.get("note");
  const open = useCallback((id: string) => router.push(`/dashboard/notes?note=${id}`, { scroll: false }), [router]);
  const close = useCallback(() => router.push("/dashboard/notes", { scroll: false }), [router]);

  // The notes list is a cached query. Local changes go through the cache (`setNotes`), and `load()` marks it stale so it refetches.
  const notesQ = useQuery({
    queryKey: qk.notes.all,
    queryFn: async () => {
      const { data, error } = await sb.from("notes").select(NOTE_COLS).order("sort_order", { ascending: false }).limit(1000);
      if (error) throw error;
      return data as Note[];
    },
  });
  const notes = notesQ.data ?? EMPTY_NOTES;
  const ready = !notesQ.isPending;
  const setNotes = useCallback((fn: (all: Note[]) => Note[]) => qc.setQueryData<Note[]>(qk.notes.all, (old) => fn(old ?? [])), [qc]);
  const load = useCallback(() => qc.invalidateQueries({ queryKey: qk.notes.all }), [qc]);
  useRealtimeInvalidate("notes", [qk.notes.all]);
  useEffect(() => {
    setErr(notesQ.isError ? "Couldn’t load your notes." : "");
  }, [notesQ.isError]);
  // The user id is needed for storage paths; fetch it separately so it's set even when the list comes straight from the cache.
  useEffect(() => {
    sb.auth.getUser().then(({ data }) => {
      uid.current = data.user?.id ?? "";
    });
  }, [sb]);

  /* ---- create / change ---- */
  const create = useCallback(
    async (init: Partial<Pick<Note, "title" | "body" | "kind" | "category">> = {}) => {
      const { data, error } = await sb
        .from("notes")
        .insert({ title: "", body: "", category: readPrefs().defaultCategory, ...init })
        .select(NOTE_COLS)
        .single();
      if (error || !data) {
        setErr("Couldn’t create a note.");
        return null;
      }
      setNotes((all) => [data as Note, ...all]);
      return data as Note;
    },
    [sb],
  );

  useEffect(() => {
    if (!ready || creating.current) return;
    if (openId === "new" || params.get("new")) {
      creating.current = true;
      create().then((n) => {
        creating.current = false;
        router.replace(n ? `/dashboard/notes?note=${n.id}` : "/dashboard/notes");
      });
    }
  }, [ready, openId, params, create, router]);

  const patchLocal = (id: string, p: Partial<Note>) => setNotes((all) => all.map((n) => (n.id === id ? { ...n, ...p } : n)));
  async function patch(id: string, p: Partial<Note>) {
    patchLocal(id, p);
    const { error } = await sb.from("notes").update(p).eq("id", id);
    if (error) {
      setErr("Couldn’t save that change.");
      load();
    }
  }

  async function upload(noteId: string, file: Blob, name: string, type: string): Promise<Attachment | null> {
    if (file.size > MAX_BYTES) {
      setErr("Files can be up to 10 MB.");
      return null;
    }
    const path = `${uid.current}/${noteId}/${crypto.randomUUID()}-${safeName(name)}`;
    const { error } = await sb.storage.from("note-files").upload(path, file, { contentType: type || "application/octet-stream" });
    if (error) {
      setErr("Couldn’t upload that file.");
      return null;
    }
    return { path, name, type: type || "application/octet-stream", size: file.size };
  }
  async function attach(noteId: string, file: File) {
    const a = await upload(noteId, file, file.name, file.type);
    const n = notes.find((x) => x.id === noteId);
    if (a && n) patch(noteId, { attachments: [...n.attachments, a] });
  }
  async function removeAttachment(noteId: string, a: Attachment) {
    const n = notes.find((x) => x.id === noteId);
    if (!n) return;
    await sb.storage.from("note-files").remove([a.path]);
    patch(noteId, { attachments: n.attachments.filter((x) => x.path !== a.path) });
  }

  async function remove(id: string) {
    const n = notes.find((x) => x.id === id);
    if (!n) return;
    const yes = await ask({
      title: "Delete this note?",
      body: <>“{displayTitle(n)}” and its attachments will be permanently deleted. This can’t be undone.</>,
      confirmLabel: "Delete note",
      danger: true,
    });
    if (!yes) return;
    if (n.attachments.length) await sb.storage.from("note-files").remove(n.attachments.map((a) => a.path));
    const { error } = await sb.from("notes").delete().eq("id", id);
    if (error) return setErr("Couldn’t delete that note.");
    setNotes((all) => all.filter((x) => x.id !== id));
    close();
  }
  async function duplicate(id: string) {
    const n = notes.find((x) => x.id === id);
    if (!n) return;
    const c = await create({ title: `${n.title || displayTitle(n)} (copy)`, body: n.body, category: n.category, kind: "text" });
    if (c) open(c.id);
  }

  // Right-click actions on a note card (see lib/context-actions).
  useCtxActions("note", (id, action) => {
    const n = notes.find((x) => x.id === id);
    if (!n) return;
    if (action === "open") open(id);
    else if (action === "pin") void patch(id, { pinned: !n.pinned });
    else if (action === "duplicate") void duplicate(id);
    else if (action === "delete") void remove(id);
  });

  /* ---- quick capture ---- */
  async function capture(openEditor = false) {
    const text = cap.trim();
    if (!text && !openEditor) return;
    const [first, ...rest] = text.split("\n");
    const n = await create({ title: text ? first.slice(0, 120) : "", body: rest.join("\n").trim() });
    setCap("");
    if (n && openEditor) open(n.id);
  }
  async function captureFile(f: File) {
    const n = await create({ title: f.name.replace(/\.[^.]+$/, "").slice(0, 120) });
    if (!n) return;
    const a = await upload(n.id, f, f.name, f.type);
    if (a)
      (patchLocal(n.id, { attachments: [a] }),
        await sb
          .from("notes")
          .update({ attachments: [a] })
          .eq("id", n.id));
    open(n.id);
  }

  async function toggleRecord() {
    if (recording) return mr.current?.stop();
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      return setErr("Microphone access was blocked. Allow it in your browser to record voice notes.");
    }
    const rec = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const timer = setInterval(() => setSecs((s) => s + 1), 1000);
    rec.onstop = async () => {
      clearInterval(timer);
      stream.getTracks().forEach((t) => t.stop());
      setRecording(false);
      setSecs(0);
      const type = (rec.mimeType || "audio/webm").split(";")[0];
      const blob = new Blob(chunks, { type });
      if (!blob.size) return;
      const n = await create({ title: "Voice note", kind: "voice", category: "Others" });
      if (!n) return;
      const a = await upload(n.id, blob, `voice-note.${type.includes("mp4") ? "m4a" : "webm"}`, type);
      if (a) {
        patchLocal(n.id, { attachments: [a] });
        await sb
          .from("notes")
          .update({ attachments: [a] })
          .eq("id", n.id);
      }
      open(n.id);
    };
    mr.current = rec;
    setSecs(0);
    setRecording(true);
    rec.start();
  }
  useEffect(
    () => () => {
      if (mr.current?.state === "recording") mr.current.stop();
    },
    [],
  );

  /* ---- shortcuts ---- */
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key.toLowerCase() === "e") {
        e.preventDefault();
        capture(true);
      }
    };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  });

  /* ---- list ---- */
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    const list = notes.filter(
      (n) =>
        (filter === "all" || (filter === "pinned" ? n.pinned : n.kind === "voice")) &&
        (!cats.length || cats.includes(n.category)) &&
        (!withFiles || n.attachments.length > 0) &&
        (!t || `${n.title} ${n.body} ${n.category}`.toLowerCase().includes(t)),
    );
    const by: Record<Sort, (a: Note, b: Note) => number> = {
      manual: (a, b) => b.sort_order - a.sort_order,
      edited: (a, b) => +new Date(b.updated_at) - +new Date(a.updated_at),
      title: (a, b) => displayTitle(a).localeCompare(displayTitle(b)),
    };
    return list.sort((a, b) => Number(b.pinned) - Number(a.pinned) || by[sort](a, b));
  }, [notes, q, filter, cats, withFiles, sort]);

  async function drop(targetId: string) {
    const id = dragId;
    setDragId(null);
    setOverId(null);
    if (!id || id === targetId) return;
    const order = shown.filter((n) => n.id !== id);
    const at = order.findIndex((n) => n.id === targetId);
    const above = order[at - 1],
      below = order[at];
    // Land just before the card it was dropped on.
    const so = above && below ? (above.sort_order + below.sort_order) / 2 : below ? below.sort_order + 1000 : 0;
    patch(id, { sort_order: so });
  }

  const current = openId && openId !== "new" ? notes.find((n) => n.id === openId) : undefined;
  const filtersOn = cats.length + (withFiles ? 1 : 0);
  const pills: [Filter, string][] = [
    ["all", "All notes"],
    ["pinned", "Pinned"],
    ["voice", "Voice"],
  ];

  return (
    <div className="nt" data-open={!!current}>
      {dialog}
      <div className="nt-head">
        <h1 className="h2">
          Notes <sup>{notes.length}</sup>
        </h1>
        <div className="nt-tools">
          <label className="nt-search">
            <FA icon={faMagnifyingGlass} />
            <input ref={search} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notes" aria-label="Search notes" />
          </label>
          <div className="nt-pills" role="group" aria-label="Filter notes">
            {pills.map(([k, l]) => (
              <button key={k} data-on={filter === k} aria-pressed={filter === k} onClick={() => setFilter(k)}>
                {l}
              </button>
            ))}
            <Menu
              label="More filters"
              trigger={<>More filters{filtersOn > 0 && <b className="nt-badge">{filtersOn}</b>}</>}
              className="nt-pill-menu"
            >
              <MenuLabel>Category</MenuLabel>
              {CATEGORIES.map((c) => (
                <MenuCheckItem
                  key={c}
                  checked={cats.includes(c)}
                  onSelect={() => setCats((x) => (x.includes(c) ? x.filter((y) => y !== c) : [...x, c]))}
                >
                  {c}
                </MenuCheckItem>
              ))}
              <MenuSeparator />
              <MenuCheckItem checked={withFiles} onSelect={() => setWithFiles(!withFiles)}>
                With attachments
              </MenuCheckItem>
              {filtersOn > 0 && (
                <MenuItem
                  onSelect={() => {
                    setCats([]);
                    setWithFiles(false);
                  }}
                >
                  Clear filters
                </MenuItem>
              )}
            </Menu>
          </div>
          <Menu label="Sort and options" trigger={<FA icon={faEllipsis} />} className="nt-dots">
            <MenuLabel>Sort by</MenuLabel>
            <MenuRadioGroup value={sort} onValueChange={(v) => setSort(v as Sort)}>
              {(
                [
                  ["manual", "Manual (drag to reorder)"],
                  ["edited", "Last edited"],
                  ["title", "Title A–Z"],
                ] as [Sort, string][]
              ).map(([k, l]) => (
                <MenuRadioItem key={k} value={k}>
                  {l}
                </MenuRadioItem>
              ))}
            </MenuRadioGroup>
          </Menu>
          <button className="btn btn-secondary btn-sm" onClick={() => capture(true)}>
            <FA icon={faPlus} /> New note
          </button>
        </div>
      </div>

      {err && (
        <p className="form-err" role="alert">
          {err}
        </p>
      )}

      <div className="nt-wrap">
        <div className="nt-cards" role="list">
          {shown.map((n) => (
            <article
              key={n.id}
              role="listitem"
              tabIndex={0}
              className={`nt-card at-${toneOf(n)}`}
              {...ctxProps("note", n.id, { pinned: n.pinned })}
              data-on={n.id === openId}
              data-over={overId === n.id && dragId !== n.id}
              data-drag={dragId === n.id}
              draggable={sort === "manual"}
              onDragStart={() => setDragId(n.id)}
              onDragEnd={() => {
                setDragId(null);
                setOverId(null);
              }}
              onDragOver={(e) => {
                if (dragId) {
                  e.preventDefault();
                  setOverId(n.id);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                drop(n.id);
              }}
              onClick={() => open(n.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.target === e.currentTarget) open(n.id);
              }}
            >
              <div className="nt-grip" aria-hidden>
                {sort === "manual" ? <FA icon={faGripVertical} /> : null}
                {n.pinned && <FA icon={faThumbtack} className="nt-pin" />}
                <button
                  type="button"
                  className="nt-del"
                  aria-label={`Delete ${displayTitle(n)}`}
                  title="Delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(n.id);
                  }}
                >
                  <FA icon={faTrash} />
                </button>
              </div>
              <h3>{displayTitle(n)}</h3>
              {n.kind === "voice" && (
                <span className="nt-voice">
                  <FA icon={faWaveSquare} /> Voice note
                </span>
              )}
              {n.body.trim() && (
                <div className="nt-prev">
                  <Markdown text={n.body} />
                </div>
              )}
              {n.attachments.length > 0 && n.kind !== "voice" && (
                <span className="nt-voice">
                  <FA icon={faPaperclip} /> {n.attachments.length} attached
                </span>
              )}
              <footer>
                <span>{n.category}</span>
                <span>Edited {editedLabel(n.updated_at)}</span>
              </footer>
            </article>
          ))}
          {ready && shown.length === 0 && (
            <p className="ap-none nt-empty">
              {notes.length ? "No notes match those filters." : "No notes yet — jot your first one below."}
            </p>
          )}
        </div>

        {current && (
          <NoteEditor
            key={current.id}
            note={current}
            sb={sb}
            onClose={close}
            onLocal={(id, p) => patchLocal(id, p)}
            onSaved={(id, updated_at) => patchLocal(id, { updated_at })}
            onPatch={patch}
            onDelete={remove}
            onDuplicate={duplicate}
            onAttach={attach}
            onRemoveAttachment={removeAttachment}
          />
        )}
      </div>

      <form
        className="nt-cap"
        data-wide={!current}
        onSubmit={(e) => {
          e.preventDefault();
          capture();
        }}
      >
        <input
          ref={capRef}
          value={cap}
          onChange={(e) => setCap(e.target.value)}
          maxLength={5000}
          placeholder="Write a new note…"
          aria-label="Write a new note"
        />
        {recording && (
          <span className="nt-rec" role="status">
            ● {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")}
          </span>
        )}
        <button
          type="button"
          className="ne-btn"
          data-on={recording}
          aria-label={recording ? "Stop recording" : "Record a voice note"}
          onClick={toggleRecord}
        >
          <FA icon={recording ? faStop : faMicrophone} />
        </button>
        <button type="button" className="ne-btn" aria-label="Add an image or file" onClick={() => img.current?.click()}>
          <FA icon={faImage} />
        </button>
        <button type="button" className="ne-btn" aria-label="Open in editor" title="Open in editor" onClick={() => capture(true)}>
          <kbd>⌘E</kbd>
        </button>
        <input
          ref={img}
          type="file"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) captureFile(f);
            e.target.value = "";
          }}
        />
      </form>
    </div>
  );
}
