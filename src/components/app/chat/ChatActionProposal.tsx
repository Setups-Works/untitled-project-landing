"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ChatAction, ChatProposal } from "../../../lib/chat-actions";
import { qk } from "../../../lib/query/keys";

const LABEL: Record<ChatAction["kind"], string> = { task: "to-do", journal: "journal entry", note: "note" };
const WHERE: Record<ChatAction["kind"], string> = { task: "To-do", journal: "Journal", note: "Notes" };

const dateLabel = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
};

/**
 * The drafts the assistant prepared from one message (a journal entry, to-dos, notes…). Nothing is saved until the person
 * presses Create on a draft, or "Create all". Created drafts turn into links to the saved item.
 */
export default function ChatActionProposal({
  proposals,
  messageId,
  chatId,
}: {
  proposals: ChatProposal[];
  messageId: string;
  chatId: string;
}) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState<number | "all" | null>(null);
  const [error, setError] = useState("");
  const pending = proposals.filter((p) => !p.created);

  async function create(which: number | "all") {
    setBusy(which);
    setError("");
    try {
      const res = await fetch("/api/v1/ai/actions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messageId, which }),
      });
      const out = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(out?.error ?? "Couldn’t create that item.");
      await Promise.all([
        qc.invalidateQueries({ queryKey: qk.chats.messages(chatId) }),
        qc.invalidateQueries({ queryKey: qk.notes.all }),
        qc.invalidateQueries({ queryKey: qk.tasks.all }),
        qc.invalidateQueries({ queryKey: qk.journal.all }),
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn’t create that item.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-2" role="group" aria-label="Drafts to review">
      {proposals.map((p) => {
        const a = p.action;
        const preview = a.kind === "task" ? a.description : a.body;
        return (
          <section
            key={p.index}
            className="rounded-r2 border border-line bg-surface-muted p-3 text-fg"
            aria-label={`${LABEL[a.kind]} draft`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
              {p.created ? `Saved to ${WHERE[a.kind]}` : `${WHERE[a.kind]} · draft`}
            </p>
            {a.kind !== "journal" && <p className="mt-1 font-semibold">{a.title}</p>}
            {preview && <p className="mt-1 line-clamp-6 whitespace-pre-wrap break-words text-sm text-fg-muted">{preview}</p>}
            {a.kind === "task" && (
              <p className="mt-2 text-xs text-fg-muted">{a.due_date ? `Due ${dateLabel(a.due_date)}` : "No due date"}</p>
            )}
            {a.kind === "journal" && <p className="mt-2 text-xs text-fg-muted">For {dateLabel(a.entry_date)}</p>}
            {p.created ? (
              <a className="btn btn-secondary btn-sm mt-3 inline-flex" href={p.created.path}>
                Open {LABEL[a.kind]}
              </a>
            ) : (
              <button className="btn btn-primary btn-sm mt-3" disabled={busy !== null} onClick={() => create(p.index)}>
                {busy === p.index ? "Creating…" : `Create ${LABEL[a.kind]}`}
              </button>
            )}
          </section>
        );
      })}
      {pending.length > 1 && (
        <button className="btn btn-primary self-start" disabled={busy !== null} onClick={() => create("all")}>
          {busy === "all" ? "Creating…" : `Create all ${pending.length}`}
        </button>
      )}
      {error && (
        <p className="text-sm text-clay-fg" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
