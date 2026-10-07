"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import {
  faBold,
  faHeading,
  faListUl,
  faQuoteLeft,
  faCode,
  faRotateLeft,
  faRotateRight,
  faWandMagicSparkles,
  faLink,
  faMicrophone,
  faTerminal,
  faMagnifyingGlass,
  faClockRotateLeft,
  faEllipsisVertical,
  faXmark,
  faThumbtack,
  faPaperclip,
  faTrash,
  faCopy,
  faDownload,
  faChevronUp,
  faChevronDown,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Attachment, Note, NoteVersion } from "../../lib/workspace";
import { CATEGORIES, TONES, editedLabel, lineCount, plural, toneOf, wordCount } from "../../lib/notes";
import { useAutosave, statusText } from "./useAutosave";
import Menu, { MenuItem, MenuLabel, MenuRadioGroup, MenuRadioItem, MenuSeparator } from "../ui/Menu";
import { usePrompt } from "../ui/Confirm";

const SLASH = [
  { k: "h1", t: "Heading 1", s: "# " },
  { k: "h2", t: "Heading 2", s: "## " },
  { k: "bullet", t: "Bullet list", s: "- " },
  { k: "check", t: "Checklist", s: "- [ ] " },
  { k: "quote", t: "Quote", s: "> " },
  { k: "code", t: "Code block", s: "```\n\n```", caret: 4 },
  { k: "line", t: "Divider", s: "---\n" },
  { k: "date", t: "Today’s date", s: "" },
];

type SR = {
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};

export default function NoteEditor({
  note,
  sb,
  onClose,
  onLocal,
  onSaved,
  onPatch,
  onDelete,
  onDuplicate,
  onAttach,
  onRemoveAttachment,
}: {
  note: Note;
  sb: SupabaseClient;
  onClose: () => void;
  onLocal: (id: string, p: { title: string; body: string }) => void;
  onSaved: (id: string, updated_at: string) => void;
  onPatch: (id: string, p: Partial<Note>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onAttach: (id: string, f: File) => void;
  onRemoveAttachment: (id: string, a: Attachment) => void;
}) {
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);
  const ta = useRef<HTMLTextAreaElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const rec = useRef<SR | null>(null);
  const [dictating, setDictating] = useState(false);
  const [slash, setSlash] = useState<{ start: number; q: string } | null>(null);
  const [si, setSi] = useState(0);
  const [find, setFind] = useState<string | null>(null);
  const [hist, setHist] = useState<NoteVersion[] | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [range, setRange] = useState<[number, number]>([0, 0]);
  const selected = range[1] > range[0] ? body.slice(range[0], range[1]) : "";
  const { prompt: askLink, dialog: linkDialog } = usePrompt();

  const value = useMemo(() => ({ title, body }), [title, body]);
  const status = useAutosave(
    value,
    async (v) => {
      const updated_at = new Date().toISOString();
      const { error } = await sb
        .from("notes")
        .update({ ...v, updated_at })
        .eq("id", note.id);
      if (error) throw error;
      onSaved(note.id, updated_at);
    },
    800,
    note.id,
  );
  useEffect(() => {
    onLocal(note.id, value);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const paths = note.attachments.map((a) => a.path).join("|");
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

  useEffect(() => () => rec.current?.stop(), []);

  /* ---- text helpers (execCommand keeps the browser's native undo/redo working) ---- */
  const put = (text: string, from?: number, to?: number) => {
    const el = ta.current!;
    el.focus();
    if (from !== undefined) el.setSelectionRange(from, to ?? from);
    if (!document.execCommand("insertText", false, text)) {
      const s = el.selectionStart,
        e = el.selectionEnd;
      setBody(el.value.slice(0, s) + text + el.value.slice(e));
    }
  };
  const wrap = (pre: string, post = pre) => {
    const el = ta.current!;
    const s = el.selectionStart,
      sel = el.value.slice(s, el.selectionEnd);
    put(pre + sel + post);
    if (!sel) el.setSelectionRange(s + pre.length, s + pre.length);
  };
  const prefix = (p: string) => {
    const el = ta.current!;
    const ls = el.value.lastIndexOf("\n", el.selectionStart - 1) + 1;
    el.focus();
    if (el.value.startsWith(p, ls)) {
      el.setSelectionRange(ls, ls + p.length);
      document.execCommand("delete");
    } else put(p, ls, ls);
  };
  const codeBlock = () => {
    const el = ta.current!;
    const sel = el.value.slice(el.selectionStart, el.selectionEnd);
    put("```\n" + sel + "\n```");
  };
  const link = async () => {
    const el = ta.current!;
    // The dialog steals focus, so remember what was selected and put it back afterwards.
    const [s, e] = [el.selectionStart, el.selectionEnd];
    const text = el.value.slice(s, e);
    const url = await askLink({
      title: "Add a link",
      body: text ? (
        <>The selected text “{text.length > 40 ? `${text.slice(0, 40)}…` : text}” will become a link.</>
      ) : (
        "Paste or type the address you want to link to."
      ),
      label: "Link address",
      placeholder: "https://example.com",
      confirmLabel: "Add link",
      validate: (v) => (/^https?:\/\/\S+\.\S+/i.test(v) ? null : "Enter an address that starts with http:// or https://"),
    });
    el.focus();
    if (!url) return;
    el.setSelectionRange(s, e);
    put(`[${text || "link"}](${url})`);
  };
  const history = (cmd: "undo" | "redo") => {
    ta.current?.focus();
    document.execCommand(cmd);
  };

  /* ---- slash commands ---- */
  const items = slash ? SLASH.filter((s) => s.t.toLowerCase().includes(slash.q) || s.k.includes(slash.q)) : [];
  const detect = (el: HTMLTextAreaElement) => {
    const pos = el.selectionStart;
    const m = /(^|\s)\/(\w*)$/.exec(el.value.slice(0, pos));
    setSlash(m ? { start: pos - m[2].length - 1, q: m[2].toLowerCase() } : null);
    setSi(0);
  };
  const choose = (it: (typeof SLASH)[number]) => {
    const el = ta.current!;
    const start = slash!.start;
    const text =
      it.k === "date"
        ? new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })
        : it.s;
    put(text, start, el.selectionStart);
    if ("caret" in it && it.caret) el.setSelectionRange(start + it.caret, start + it.caret);
    setSlash(null);
  };
  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!slash || !items.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSi((si + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSi((si - 1 + items.length) % items.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      choose(items[si]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setSlash(null);
    }
  };

  /* ---- dictation ---- */
  const SpeechCtor =
    typeof window !== "undefined"
      ? ((window as unknown as Record<string, new () => SR>).SpeechRecognition ??
        (window as unknown as Record<string, new () => SR>).webkitSpeechRecognition)
      : undefined;
  const dictate = () => {
    if (dictating) return rec.current?.stop();
    if (!SpeechCtor) return;
    const r = new SpeechCtor();
    r.continuous = true;
    r.interimResults = false;
    r.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) put(e.results[i][0].transcript.trim() + " ");
    };
    r.onend = () => setDictating(false);
    rec.current = r;
    setDictating(true);
    try {
      r.start();
    } catch {
      setDictating(false);
    }
  };

  /* ---- find ---- */
  const matches = useMemo(() => {
    if (!find) return 0;
    return body.toLowerCase().split(find.toLowerCase()).length - 1;
  }, [find, body]);
  const step = (dir: 1 | -1) => {
    const el = ta.current;
    if (!el || !find) return;
    const hay = el.value.toLowerCase(),
      needle = find.toLowerCase();
    let i = dir === 1 ? hay.indexOf(needle, el.selectionEnd) : hay.lastIndexOf(needle, el.selectionStart - 1);
    if (i < 0) i = dir === 1 ? hay.indexOf(needle) : hay.lastIndexOf(needle);
    if (i < 0) return;
    el.focus();
    el.setSelectionRange(i, i + needle.length);
  };

  /* ---- history ---- */
  async function openHistory() {
    setHist([]);
    const { data } = await sb
      .from("note_versions")
      .select("id,title,body,created_at")
      .eq("note_id", note.id)
      .order("created_at", { ascending: false })
      .limit(30);
    setHist((data as NoteVersion[]) ?? []);
  }
  function restore(v: NoteVersion) {
    setTitle(v.title);
    const el = ta.current!;
    el.focus();
    el.setSelectionRange(0, el.value.length);
    put(v.body);
    setHist(null);
  }

  function download() {
    const blob = new Blob([`# ${title || "Untitled"}\n\n${body}\n`], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(title || "note").replace(/[^\w\- ]+/g, "").trim() || "note"}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const tb = (
    label: string,
    icon: Parameters<typeof FA>[0]["icon"],
    run: () => void,
    extra: { disabled?: boolean; on?: boolean; title?: string } = {},
  ) => (
    <button
      type="button"
      className="ne-btn"
      aria-label={label}
      title={extra.title ?? label}
      disabled={extra.disabled}
      data-on={extra.on}
      onMouseDown={(e) => e.preventDefault()}
      onClick={run}
    >
      <FA icon={icon} />
    </button>
  );

  return (
    <aside className={`ne at-${toneOf(note)}`} aria-label="Note editor">
      {linkDialog}
      <div className="ne-head">
        <div className="ne-title">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder="Untitled Note"
            aria-label="Note title"
          />
          <div className="ne-chips">
            <span>{selected ? `${wordCount(selected)} of ${plural(wordCount(body), "word")}` : plural(wordCount(body), "word")}</span>
            <span>{selected ? `${lineCount(selected)} of ${plural(lineCount(body), "line")}` : plural(lineCount(body), "line")}</span>
            <span className="ne-st">{statusText(status) || `Edited ${editedLabel(note.updated_at)}`}</span>
          </div>
        </div>
        <button
          className="ne-btn"
          aria-label={note.pinned ? "Unpin note" : "Pin note"}
          data-on={note.pinned}
          onClick={() => onPatch(note.id, { pinned: !note.pinned })}
        >
          <FA icon={faThumbtack} />
        </button>
        <button className="ne-btn ne-trash" aria-label="Delete note" title="Delete note" onClick={() => onDelete(note.id)}>
          <FA icon={faTrash} />
        </button>
        <button className="ne-btn" aria-label="Close editor" onClick={onClose}>
          <FA icon={faXmark} />
        </button>
      </div>

      <div className="ne-bar" role="toolbar" aria-label="Formatting">
        {tb("Bold", faBold, () => wrap("**"))}
        {tb("Quote", faQuoteLeft, () => prefix("> "))}
        {tb("Heading", faHeading, () => prefix("# "))}
        {tb("Bullet list", faListUl, () => prefix("- "))}
        {tb("Inline code", faCode, () => wrap("`"))}
        {tb("Undo", faRotateLeft, () => history("undo"))}
        {tb("Redo", faRotateRight, () => history("redo"))}
        <span className="ne-gap" />
        {tb("AI actions", faWandMagicSparkles, () => {}, { disabled: true, title: "Connect an AI provider to use AI actions" })}
        {tb("Add link", faLink, link)}
        {tb(dictating ? "Stop dictation" : "Dictate", faMicrophone, dictate, {
          disabled: !SpeechCtor,
          on: dictating,
          title: SpeechCtor ? (dictating ? "Stop dictation" : "Dictate") : "Dictation isn’t supported in this browser",
        })}
        {tb("Code block", faTerminal, codeBlock)}
        {tb("Find in note", faMagnifyingGlass, () => setFind(find === null ? "" : null), { on: find !== null })}
        {tb("Version history", faClockRotateLeft, openHistory, { on: hist !== null })}
        <Menu label="More" trigger={<FA icon={faEllipsisVertical} />} className="ne-more">
          <MenuLabel>Colour</MenuLabel>
          <div className="ne-swatches" role="group" aria-label="Note colour">
            {TONES.map((t) => (
              <MenuItem
                key={t}
                keepOpen
                className={`ne-swatch at-${t}`}
                aria-label={`${t}${toneOf(note) === t ? " (selected)" : ""}`}
                data-on={toneOf(note) === t}
                onSelect={() => onPatch(note.id, { color: t })}
              >
                <span className="sr-only">{t}</span>
              </MenuItem>
            ))}
          </div>
          <MenuSeparator />
          <MenuLabel>Category</MenuLabel>
          <MenuRadioGroup value={note.category} onValueChange={(c) => onPatch(note.id, { category: c })}>
            {CATEGORIES.map((c) => (
              <MenuRadioItem key={c} value={c}>
                {c}
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
          <MenuSeparator />
          <MenuItem onSelect={() => file.current?.click()}>
            <span>
              <FA icon={faPaperclip} /> Attach a file
            </span>
          </MenuItem>
          <MenuItem onSelect={download}>
            <span>
              <FA icon={faDownload} /> Export as Markdown
            </span>
          </MenuItem>
          <MenuItem onSelect={() => onDuplicate(note.id)}>
            <span>
              <FA icon={faCopy} /> Duplicate
            </span>
          </MenuItem>
          <MenuItem danger onSelect={() => onDelete(note.id)}>
            <span>
              <FA icon={faTrash} /> Delete
            </span>
          </MenuItem>
        </Menu>
        <input
          ref={file}
          type="file"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onAttach(note.id, f);
            e.target.value = "";
          }}
        />
      </div>

      {find !== null && (
        <div className="ne-find">
          <input
            autoFocus
            value={find}
            onChange={(e) => setFind(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") step(e.shiftKey ? -1 : 1);
              if (e.key === "Escape") setFind(null);
            }}
            placeholder="Find in note…"
            aria-label="Find in note"
          />
          <small>{find ? `${matches} found` : ""}</small>
          <button className="ne-btn" aria-label="Previous match" onClick={() => step(-1)}>
            <FA icon={faChevronUp} />
          </button>
          <button className="ne-btn" aria-label="Next match" onClick={() => step(1)}>
            <FA icon={faChevronDown} />
          </button>
        </div>
      )}
      {msg && (
        <p className="form-err ne-msg" role="alert">
          {msg}
        </p>
      )}

      <div className="ne-body">
        <textarea
          ref={ta}
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            detect(e.target);
          }}
          onKeyDown={onKey}
          onSelect={(e) => setRange([e.currentTarget.selectionStart, e.currentTarget.selectionEnd])}
          onBlur={() => setSlash(null)}
          onClick={(e) => detect(e.currentTarget)}
          maxLength={100000}
          placeholder="Write something, or type / for commands…"
          aria-label="Note body"
        />
        {slash && items.length > 0 && (
          <ul className="ne-slash" role="listbox" aria-label="Commands">
            {items.map((it, i) => (
              <li
                key={it.k}
                role="option"
                aria-selected={i === si}
                data-on={i === si}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(it);
                }}
              >
                {it.t}
              </li>
            ))}
          </ul>
        )}
      </div>

      {note.attachments.length > 0 && (
        <ul className="ne-files" aria-label="Attachments">
          {note.attachments.map((a) => {
            const u = urls[a.path];
            return (
              <li key={a.path}>
                {u && a.type.startsWith("image/") && /* eslint-disable-next-line @next/next/no-img-element */ <img src={u} alt={a.name} />}
                {u && a.type.startsWith("audio/") && <audio controls src={u} aria-label={a.name} />}
                {!a.type.startsWith("image/") &&
                  !a.type.startsWith("audio/") &&
                  (u ? (
                    <a href={u} target="_blank" rel="noopener noreferrer">
                      <FA icon={faPaperclip} /> {a.name}
                    </a>
                  ) : (
                    <span>{a.name}</span>
                  ))}
                <button className="icon-btn" aria-label={`Remove ${a.name}`} onClick={() => onRemoveAttachment(note.id, a)}>
                  <FA icon={faTrash} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {hist !== null && (
        <div className="ne-hist" role="dialog" aria-label="Version history">
          <div className="ap-card-h">
            <span>Version history</span>
            <button className="ne-btn" aria-label="Close history" onClick={() => setHist(null)}>
              <FA icon={faXmark} />
            </button>
          </div>
          {hist.length === 0 && <p className="ap-none">No earlier versions yet. They’re saved as you edit.</p>}
          <ul>
            {hist.map((v) => (
              <li key={v.id}>
                <div>
                  <b>
                    {new Date(v.created_at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </b>
                  <small>{(v.title || v.body).slice(0, 70) || "Empty"}</small>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => restore(v)}>
                  Restore
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
