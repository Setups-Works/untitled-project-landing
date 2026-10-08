"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faArrowUpRightFromSquare, faCommentDots, faPaperPlane, faPlus, faXmark } from "@fortawesome/free-solid-svg-icons";
import { api } from "../../lib/api/client";
import { qk } from "../../lib/query/keys";
import { isoDate } from "../../lib/dates";
import { prettyTitle } from "../../lib/chat";
import { parseChatActions } from "../../lib/chat-actions";
import { NO_AI } from "../../lib/ai";
import type { Message } from "../../lib/workspace";
import { useDraftText } from "../../hooks/useDraft";
import { useAiProviders } from "../../features/ai/useAiProviders";
import Markdown from "./Markdown";
import ChatActionProposal from "./chat/ChatActionProposal";

const CHAT_KEY = "up_widget_chat";
const MSG_COLS = "id,role,body,created_at,attachments";
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
 * small conversation panel. It uses the same chats, messages and AI route as the chat page, so a conversation started here
 * continues there ("Open in full chat").
 */
export default function ChatWidget() {
  const pathname = usePathname();
  const hidden = pathname.startsWith("/dashboard/chat");
  const sb = useMemo(api, []);
  const qc = useQueryClient();
  const { provider } = useAiProviders();
  const [open, setOpen] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [text, setText] = useDraftText("widget:chat");
  const [streaming, setStreaming] = useState<{ chatId: string; text: string } | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setChatId(readChat()), []);

  const messages = useQuery({
    queryKey: qk.chats.messages(chatId ?? "none"),
    enabled: !!chatId && open && !hidden,
    queryFn: async () => {
      const { data, error } = await sb.from("chat_messages").select(MSG_COLS).eq("chat_id", chatId!).order("created_at");
      if (error) throw error;
      return (data ?? []) as Message[];
    },
  });
  const list = chatId ? (messages.data ?? []) : [];
  const live = streaming && streaming.chatId === chatId ? streaming.text : null;

  // Keep the newest message in view.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [list.length, live, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        launcherRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (hidden) return null;

  const noAi = provider === NO_AI.id;

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
      await qc.invalidateQueries({ queryKey: qk.chats.all });
    }
  }

  async function send(raw = text) {
    const body = raw.trim();
    if (!body || busy) return;
    setBusy(true);
    setErr("");
    try {
      const startChat = async () => {
        const { data, error } = await sb
          .from("chats")
          .insert({ title: prettyTitle(body.split("\n")[0].trim().slice(0, 60)) })
          .select("id")
          .single();
        if (error || !data) return null;
        setChatId(data.id as string);
        saveChat(data.id as string);
        return data.id as string;
      };
      const post = (chat: string) => sb.from("chat_messages").insert({ chat_id: chat, role: "user", body, attachments: [] });
      let id = chatId ?? (await startChat());
      if (!id) return setErr("Couldn’t start that chat.");
      let { error } = await post(id);
      // The remembered conversation may have been deleted (e.g. from the chat page): carry on in a new one.
      if (error && chatId) {
        id = await startChat();
        if (!id) return setErr("Couldn’t start that chat.");
        ({ error } = await post(id));
      }
      if (error) return setErr("Couldn’t send that message.");
      setText("");
      const now = new Date().toISOString();
      await sb.from("chats").update({ updated_at: now, last_read_at: now }).eq("id", id);
      await qc.invalidateQueries({ queryKey: qk.chats.all });
      if (!noAi) await reply(id);
    } finally {
      setBusy(false);
    }
  }

  function fresh() {
    setChatId(null);
    saveChat(null);
    setErr("");
    inputRef.current?.focus();
  }

  return (
    <div
      data-no-swipe
      className="fixed bottom-4 right-4 z-40 flex font-sans text-fg flex-col items-end gap-3 max-[600px]:bottom-3 max-[600px]:right-3"
    >
      {open && (
        <section
          role="dialog"
          aria-label="Chat assistant"
          className="animate-glass-in flex h-[min(560px,calc(100dvh-110px))] w-[min(380px,calc(100vw-24px))] flex-col overflow-hidden rounded-r4 border border-line bg-page shadow-e4 motion-reduce:animate-none [html[data-motion=reduce]_&]:animate-none"
        >
          <header className="flex items-center gap-3 border-b border-line px-4 py-3">
            <span className="grid size-9 place-items-center rounded-full bg-fill-dark text-on-dark" aria-hidden>
              <FA icon={faCommentDots} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-serif text-[22px] leading-tight text-fg-strong">Assistant</p>
              <p className="text-xs text-fg-muted">{noAi ? "AI is off · messages are saved" : "Ask anything or organise your day"}</p>
            </div>
            <button type="button" className="icon-btn" aria-label="New conversation" title="New conversation" onClick={fresh}>
              <FA icon={faPlus} />
            </button>
            {chatId && (
              <Link className="icon-btn" aria-label="Open in full chat" title="Open in full chat" href={`/dashboard/chat?c=${chatId}`}>
                <FA icon={faArrowUpRightFromSquare} />
              </Link>
            )}
            <button type="button" className="icon-btn" aria-label="Close chat" onClick={() => setOpen(false)}>
              <FA icon={faXmark} />
            </button>
          </header>

          <div ref={listRef} className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4" aria-live="polite">
            {list.length === 0 && live === null && (
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
                      className="rounded-pill bg-surface px-4 py-2 text-left text-sm text-fg shadow-e1 transition hover:bg-surface-muted"
                      onClick={() => {
                        setText(s);
                        inputRef.current?.focus();
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {list.map((m) => {
              if (m.role === "user")
                return (
                  <div
                    key={m.id}
                    className="max-w-[85%] self-end whitespace-pre-wrap break-words rounded-r3 rounded-br-lg bg-fg px-4 py-2.5 text-sm text-on-dark"
                  >
                    {m.body}
                  </div>
                );
              const parsed = parseChatActions(m.body);
              return (
                <div key={m.id} className="max-w-[92%] self-start rounded-r3 rounded-bl-lg bg-surface px-4 py-3 text-sm shadow-e1">
                  {parsed.body && <Markdown text={parsed.body} />}
                  {parsed.proposals.length > 0 && chatId && (
                    <ChatActionProposal proposals={parsed.proposals} messageId={m.id} chatId={chatId} />
                  )}
                </div>
              );
            })}
            {live !== null && (
              <div className="max-w-[92%] self-start rounded-r3 rounded-bl-lg bg-surface px-4 py-3 text-sm shadow-e1">
                {live ? <Markdown text={parseChatActions(live).body} /> : <span className="text-fg-muted">Thinking…</span>}
              </div>
            )}
          </div>

          {err && (
            <p className="px-4 pb-1 text-sm text-clay-fg" role="alert">
              {err}
            </p>
          )}
          <form
            className="flex items-end gap-2 border-t border-line p-3"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={text}
              aria-label="Message"
              placeholder="Type a message…"
              className="max-h-28 min-h-10 flex-1 resize-none rounded-r3 bg-surface px-4 py-2.5 font-sans text-sm text-fg shadow-[inset_0_0_0_1px_var(--line)] outline-none placeholder:text-fg-faint focus:shadow-[inset_0_0_0_2px_var(--fg)]"
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <button
              type="submit"
              className="grid size-10 shrink-0 place-items-center rounded-full bg-fill-dark text-on-dark transition disabled:opacity-40"
              aria-label="Send message"
              disabled={busy || !text.trim()}
            >
              <FA icon={faPaperPlane} />
            </button>
          </form>
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
