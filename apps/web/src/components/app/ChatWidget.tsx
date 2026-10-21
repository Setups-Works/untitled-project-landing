"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import {
  faArrowUpRightFromSquare,
  faClockRotateLeft,
  faClone,
  faCommentDots,
  faCopy,
  faDownload,
  faEllipsis,
  faEraser,
  faPaperclip,
  faPen,
  faPlus,
  faShareNodes,
  faThumbtack,
  faTrash,
  faTriangleExclamation,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { api } from "../../lib/api/client";
import { qk } from "../../lib/query/keys";
import { isoDate } from "../../lib/dates";
import { ageShort, prettyTitle } from "../../lib/chat";
import { safeName } from "../../lib/notes";
import { fmtTime } from "../../lib/prefs";
import { parseChatActions } from "../../lib/chat-actions";
import { NO_AI } from "../../lib/ai";
import type { Attachment, Chat, Message } from "../../lib/workspace";
import { useRealtimeInvalidate } from "../../hooks/useRealtimeInvalidate";
import { useAiProviders } from "../../features/ai/useAiProviders";
import Menu, { MenuItem, MenuLabel, MenuSeparator } from "../ui/Menu";
import { useConfirm, usePrompt } from "../ui/Confirm";
import AttachmentImage from "../ui/AttachmentImage";
import AudioWave from "../ui/AudioWave";
import Markdown from "./Markdown";
import Composer from "./chat/Composer";
import ShareDialog from "./chat/ShareDialog";
import ChatActionProposal from "./chat/ChatActionProposal";
import ShownItems from "./chat/shown/ShownItems";

const CHAT_KEY = "up_widget_chat";
const MSG_COLS = "id,role,body,created_at,attachments";
const CHAT_COLS = "id,title,updated_at,pinned,folder_id,last_read_at,share_token";
const SUGGESTIONS = ["What’s on my plate today?", "Add a to-do: call the dentist tomorrow", "Help me write a journal entry"];

const readChat = () => {
  try {
    return window.localStorage.getItem(CHAT_KEY);
  } catch {
    return null;
  }
};
const saveChat = (id: string | null) => {
  try {
    if (id) window.localStorage.setItem(CHAT_KEY, id);
    else window.localStorage.removeItem(CHAT_KEY);
  } catch {
    /* storage unavailable: the conversation just won't be remembered */
  }
};

/**
 * Helpdesk-style assistant: a bubble in the bottom-right corner of every dashboard page (except the full chat page) that opens a
 * small conversation panel. It uses the same chats, messages, composer and AI route as the chat page, so everything the chat page
 * does (attachments, voice notes, choosing the AI, history, rename, pin, share, export, clear, delete) works here too, and a
 * conversation started here continues there ("Open in full chat").
 */
export default function ChatWidget() {
  const pathname = usePathname();
  const hidden = pathname.startsWith("/dashboard/chat");
  const sb = useMemo(api, []);
  const qc = useQueryClient();
  const { providers, provider, select: selectProvider } = useAiProviders();
  const { ask, dialog: confirmDialog } = useConfirm();
  const { prompt, dialog: promptDialog } = usePrompt();
  const [open, setOpen] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [streaming, setStreaming] = useState<{ chatId: string; text: string } | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const uid = useRef("");
  const listRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setChatId(readChat()), []);
  useEffect(() => {
    sb.auth.getUser().then(({ data }) => {
      uid.current = data.user?.id ?? "";
    });
  }, [sb]);

  const live = open && !hidden;
  const chatsQ = useQuery({
    queryKey: qk.chats.list,
    enabled: live,
    queryFn: async () => {
      const { data, error } = await sb.from("chats").select(CHAT_COLS).order("updated_at", { ascending: false }).limit(500);
      if (error) throw error;
      return (data ?? []) as Chat[];
    },
  });
  const messages = useQuery({
    queryKey: qk.chats.messages(chatId ?? "none"),
    enabled: !!chatId && live,
    queryFn: async () => {
      const { data, error } = await sb.from("chat_messages").select(MSG_COLS).eq("chat_id", chatId!).order("created_at");
      if (error) throw error;
      return (data ?? []) as Message[];
    },
  });
  useRealtimeInvalidate("chats", [qk.chats.all]);
  useRealtimeInvalidate("chat_messages", [qk.chats.all]);

  const chats = chatsQ.data ?? [];
  const active = chats.find((c) => c.id === chatId) ?? null;
  const list = chatId ? (messages.data ?? []) : [];
  const typing = streaming && streaming.chatId === chatId ? streaming.text : null;

  // Keep the newest message in view.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [list.length, typing, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      // Escape belongs to an open menu or dialog first.
      if (e.key === "Escape" && !e.defaultPrevented && !document.querySelector("[role=menu],[role=dialog][aria-modal=true]")) {
        setOpen(false);
        launcherRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const paths = list.flatMap((m) => m.attachments.map((a) => a.path)).join("|");
  useEffect(() => {
    if (!paths) return setUrls({});
    let on = true;
    sb.storage
      .from("note-files")
      .createSignedUrls(paths.split("|"), 3600)
      .then(({ data }) => {
        if (on && data)
          setUrls(Object.fromEntries(data.filter((d) => d.path && d.signedUrl).map((d) => [d.path as string, d.signedUrl as string])));
      });
    return () => {
      on = false;
    };
  }, [sb, paths]);

  if (hidden) return null;

  const noAi = provider === NO_AI.id;
  const reload = () => qc.invalidateQueries({ queryKey: qk.chats.all });

  async function reply(id: string) {
    setStreaming({ chatId: id, text: "" });
    try {
      const res = await fetch("/api/v1/ai/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chatId: id, provider, localDate: isoDate() }),
      });
      if (!res.ok || !res.body) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(j.error ?? "The AI couldn’t reply. Your message was saved.");
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let out = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        out += dec.decode(value, { stream: true });
        setStreaming({ chatId: id, text: out });
      }
    } catch {
      setErr("The AI couldn’t reply. Your message was saved.");
    } finally {
      setStreaming(null);
      await reload();
    }
  }

  async function send(text: string, files: File[], saved: () => void): Promise<boolean> {
    setBusy(true);
    setErr("");
    try {
      let id = chatId;
      if (!id) {
        const title = prettyTitle((text.split("\n")[0].trim() || files[0]?.name || "New chat").slice(0, 60));
        const { data, error } = await sb.from("chats").insert({ title }).select("id").single();
        if (error || !data) {
          setErr("Couldn’t start that chat.");
          return false;
        }
        id = data.id as string;
        setChatId(id);
        saveChat(id);
      }
      const atts: Attachment[] = [];
      for (const f of files) {
        const path = `${uid.current}/chat/${id}/${crypto.randomUUID()}-${safeName(f.name)}`;
        const { error } = await sb.storage.from("note-files").upload(path, f, { contentType: f.type || "application/octet-stream" });
        if (error) setErr(`Couldn’t upload ${f.name}.`);
        else atts.push({ path, name: f.name, type: f.type || "application/octet-stream", size: f.size });
      }
      const { error } = await sb
        .from("chat_messages")
        .insert({ chat_id: id, role: "user", body: text || (atts.length ? "Attachment" : ""), attachments: atts });
      if (error) {
        setErr("Couldn’t send that message.");
        return false;
      }
      saved();
      const now = new Date().toISOString();
      await sb.from("chats").update({ updated_at: now, last_read_at: now }).eq("id", id);
      await reload();
      if (!noAi) await reply(id);
      return true;
    } finally {
      setBusy(false);
    }
  }

  function switchTo(id: string | null) {
    setChatId(id);
    saveChat(id);
    setErr("");
  }

  async function patch(p: Partial<Chat>) {
    if (!active) return;
    const { error } = await sb.from("chats").update(p).eq("id", active.id);
    if (error) setErr("Couldn’t save that change.");
    await reload();
  }

  async function rename() {
    if (!active) return;
    const t = await prompt({
      title: "Rename chat",
      label: "Chat name",
      initial: active.title,
      confirmLabel: "Save",
      validate: (v) => (v.length > 200 ? "Keep it under 200 characters." : null),
    });
    if (t) await patch({ title: t });
  }

  async function attachmentPaths(id: string) {
    const { data } = await sb.from("chat_messages").select("attachments").eq("chat_id", id);
    return (data ?? []).flatMap((m) => ((m.attachments as Attachment[]) ?? []).map((a) => a.path));
  }

  async function clear() {
    if (!active) return;
    const yes = await ask({
      title: "Clear this chat?",
      body: <>All messages in “{active.title}” will be deleted. The chat itself stays.</>,
      confirmLabel: "Clear messages",
      danger: true,
    });
    if (!yes) return;
    const files = await attachmentPaths(active.id);
    if (files.length) await sb.storage.from("note-files").remove(files);
    const { error } = await sb.from("chat_messages").delete().eq("chat_id", active.id);
    if (error) return setErr("Couldn’t clear that chat.");
    await reload();
  }

  async function remove() {
    if (!active) return;
    const yes = await ask({
      title: "Delete this chat?",
      body: <>“{active.title}” and all its messages will be permanently deleted.</>,
      confirmLabel: "Delete chat",
      danger: true,
    });
    if (!yes) return;
    const files = await attachmentPaths(active.id);
    if (files.length) await sb.storage.from("note-files").remove(files);
    const { error } = await sb.from("chats").delete().eq("id", active.id);
    if (error) return setErr("Couldn’t delete that chat.");
    switchTo(null);
    await reload();
  }

  async function duplicate() {
    if (!active) return;
    const { data: copy, error } = await sb
      .from("chats")
      .insert({ title: `${active.title} (copy)`.slice(0, 200), folder_id: active.folder_id })
      .select("id")
      .single();
    if (error || !copy) return setErr("Couldn’t duplicate that chat.");
    if (list.length) {
      const { error: e2 } = await sb
        .from("chat_messages")
        .insert(list.map((m) => ({ chat_id: copy.id, role: m.role, body: m.body, created_at: m.created_at })));
      if (e2) setErr("The chat was copied, but some messages couldn’t be.");
    }
    await reload();
    switchTo(copy.id as string);
  }

  const toMarkdown = () =>
    `# ${active?.title ?? "Chat"}\n\n` +
    list.map((m) => `**${m.role === "user" ? "You" : "Assistant"}** · ${new Date(m.created_at).toLocaleString()}\n\n${m.body}\n`).join("\n");

  async function copyMarkdown() {
    try {
      await navigator.clipboard.writeText(toMarkdown());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setErr("Couldn’t copy to the clipboard.");
    }
  }

  function exportMarkdown() {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([toMarkdown()], { type: "text/markdown" }));
    a.download = `${(active?.title ?? "chat").replace(/[^\w\- ]+/g, "").trim() || "chat"}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div
      data-no-swipe
      className="fixed bottom-4 right-4 z-40 flex font-sans text-fg flex-col items-end gap-3 max-[600px]:bottom-3 max-[600px]:right-3"
    >
      {confirmDialog}
      {promptDialog}
      {sharing && active && (
        <ShareDialog
          chat={active}
          sb={sb}
          onClose={() => setSharing(false)}
          onChange={(token) => qc.setQueryData<Chat[]>(qk.chats.list, (old) => (old ?? []).map((c) => (c.id === active.id ? { ...c, share_token: token } : c)))}
        />
      )}
      {open && (
        <section
          role="dialog"
          aria-label="Chat assistant"
          className="animate-glass-in flex h-[min(640px,calc(100dvh-110px))] w-[min(400px,calc(100vw-24px))] flex-col overflow-hidden rounded-r4 border border-line bg-page shadow-e4 motion-reduce:animate-none [html[data-motion=reduce]_&]:animate-none"
        >
          <header className="flex items-center gap-2 border-b border-line px-4 py-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-fill-dark text-on-dark" aria-hidden>
              <FA icon={faCommentDots} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-serif text-[22px] leading-tight text-fg-strong">{active ? prettyTitle(active.title) : "Assistant"}</p>
              <p className="truncate text-xs text-fg-muted">
                {noAi ? "AI is off · messages are saved" : active ? `${list.length} ${list.length === 1 ? "message" : "messages"}` : "Ask anything or organise your day"}
              </p>
            </div>
            <button type="button" className="icon-btn" aria-label="New conversation" title="New conversation" onClick={() => switchTo(null)}>
              <FA icon={faPlus} />
            </button>
            <Menu label="Chat history" trigger={<FA icon={faClockRotateLeft} />} className="cx-more">
              <MenuLabel>Recent chats</MenuLabel>
              {chats.length === 0 && <MenuItem disabled>No chats yet</MenuItem>}
              {chats.slice(0, 12).map((c) => (
                <MenuItem key={c.id} onSelect={() => switchTo(c.id)}>
                  <span>
                    {c.pinned && <FA icon={faThumbtack} />} {prettyTitle(c.title)} · {ageShort(c.updated_at)}
                  </span>
                </MenuItem>
              ))}
            </Menu>
            {active && (
              <Menu label="More options" trigger={<FA icon={faEllipsis} />} className="cx-more">
                <MenuItem onSelect={rename}>
                  <span>
                    <FA icon={faPen} /> Rename
                  </span>
                </MenuItem>
                <MenuItem onSelect={() => patch({ pinned: !active.pinned })}>
                  <span>
                    <FA icon={faThumbtack} /> {active.pinned ? "Unpin" : "Pin"}
                  </span>
                </MenuItem>
                <MenuItem onSelect={duplicate}>
                  <span>
                    <FA icon={faClone} /> Duplicate
                  </span>
                </MenuItem>
                <MenuItem onSelect={() => setSharing(true)}>
                  <span>
                    <FA icon={faShareNodes} /> {active.share_token ? "Manage shared link" : "Share"}
                  </span>
                </MenuItem>
                <MenuItem onSelect={copyMarkdown}>
                  <span>
                    <FA icon={faCopy} /> Copy as Markdown
                  </span>
                </MenuItem>
                <MenuItem onSelect={exportMarkdown}>
                  <span>
                    <FA icon={faDownload} /> Export as Markdown
                  </span>
                </MenuItem>
                <MenuItem onSelect={() => window.location.assign(`/dashboard/chat?c=${active.id}`)}>
                  <span>
                    <FA icon={faArrowUpRightFromSquare} /> Open in full chat
                  </span>
                </MenuItem>
                <MenuSeparator />
                <MenuItem danger onSelect={clear}>
                  <span>
                    <FA icon={faEraser} /> Clear messages
                  </span>
                </MenuItem>
                <MenuItem danger onSelect={remove}>
                  <span>
                    <FA icon={faTrash} /> Delete chat
                  </span>
                </MenuItem>
              </Menu>
            )}
            <button type="button" className="icon-btn" aria-label="Close chat" onClick={() => setOpen(false)}>
              <FA icon={faXmark} />
            </button>
          </header>

          <div ref={listRef} className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4" aria-live="polite">
            {copied && (
              <p className="self-center rounded-pill bg-surface px-3 py-1 text-xs text-fg-muted shadow-e1" role="status">
                Copied to clipboard
              </p>
            )}
            {list.length === 0 && typing === null && (
              <div className="my-auto text-center">
                <p className="font-serif text-[28px] leading-tight text-fg-strong">Hi, how can I help?</p>
                <p className="mt-1 text-sm text-fg-muted">
                  I can answer questions and turn what you tell me into journal entries, to-dos and notes.
                </p>
                <div className="mt-4 flex flex-col items-stretch gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="rounded-pill bg-surface px-4 py-2 text-left text-sm text-fg shadow-e1 transition hover:bg-surface-muted disabled:opacity-50"
                      disabled={busy}
                      onClick={() => void send(s, [], () => {})}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {list.map((m) => {
              const atts = m.attachments.map((a) => {
                const u = urls[a.path];
                return (
                  <div key={a.path} className="cx-att mt-2">
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
                  </div>
                );
              });
              if (m.role === "user")
                return (
                  <div
                    key={m.id}
                    className="max-w-[85%] self-end whitespace-pre-wrap break-words rounded-r3 rounded-br-r1 bg-fg px-4 py-2.5 text-sm text-on-dark"
                  >
                    {m.body && m.body !== "Attachment" && <p>{m.body}</p>}
                    {atts}
                    <small className="mt-1 block text-[11px] opacity-60">{fmtTime(m.created_at)}</small>
                  </div>
                );
              const parsed = parseChatActions(m.body);
              return (
                <div key={m.id} className="max-w-[92%] self-start rounded-r3 rounded-bl-r1 bg-surface px-4 py-3 text-sm shadow-e1">
                  {parsed.body && <Markdown text={parsed.body} />}
                  {parsed.shows.length > 0 && <ShownItems shows={parsed.shows} />}
                  {parsed.proposals.length > 0 && chatId && (
                    <ChatActionProposal proposals={parsed.proposals} messageId={m.id} chatId={chatId} />
                  )}
                  {atts}
                  <small className="mt-1 block text-[11px] text-fg-muted">{fmtTime(m.created_at)}</small>
                </div>
              );
            })}
            {typing !== null && (
              <div className="max-w-[92%] self-start rounded-r3 rounded-bl-r1 bg-surface px-4 py-3 text-sm shadow-e1" aria-busy="true">
                {typing ? <Markdown text={parseChatActions(typing).body} /> : <span className="text-fg-muted">Thinking…</span>}
              </div>
            )}
          </div>

          {err && (
            <p className="px-4 pb-1 text-sm text-clay-fg" role="alert">
              {err}
            </p>
          )}
          {noAi && (
            <p className="flex items-center justify-center gap-2 px-4 pb-2 text-xs text-fg-subtle">
              <FA icon={faTriangleExclamation} /> No AI is selected, so replies aren’t generated.
            </p>
          )}
          <div className="p-3">
            <Composer
              key={chatId ?? "new"}
              draftKey={`widget:${chatId ?? "new"}`}
              busy={busy}
              providers={providers}
              provider={provider}
              onProvider={selectProvider}
              onSend={send}
              onError={setErr}
              autoFocus
            />
          </div>
        </section>
      )}

      <button
        ref={launcherRef}
        type="button"
        aria-label={open ? "Close chat" : "Open chat"}
        aria-expanded={open}
        className="grid size-14 place-items-center rounded-full bg-fill-dark text-xl text-on-dark shadow-e3 transition-transform duration-300 hover:scale-105 active:scale-95"
        onClick={() => setOpen((o) => !o)}
      >
        <FA icon={open ? faXmark : faCommentDots} />
      </button>
    </div>
  );
}
