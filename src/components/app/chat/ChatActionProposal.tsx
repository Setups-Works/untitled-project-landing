"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ChatAction } from "../../../lib/chat-actions";
import { qk } from "../../../lib/query/keys";

export default function ChatActionProposal({ action, messageId, chatId }: { action: ChatAction; messageId: string; chatId: string }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ path: string; kind: ChatAction["kind"] } | null>(null);
  const label = action.kind === "task" ? "to-do" : action.kind === "journal" ? "journal entry" : "note";
  const preview = action.kind === "task" ? action.description : action.body;

  async function create() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/v1/ai/actions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messageId }),
      });
      const result = (await response.json().catch(() => null)) as { path?: string; kind?: ChatAction["kind"]; error?: string } | null;
      if (!response.ok || !result?.path || !result.kind) throw new Error(result?.error ?? "Couldn’t create that item.");
      setCreated({ path: result.path, kind: result.kind });
      await Promise.all([
        qc.invalidateQueries({ queryKey: qk.chats.messages(chatId) }),
        qc.invalidateQueries({ queryKey: qk.notes.all }),
        qc.invalidateQueries({ queryKey: qk.tasks.all }),
        qc.invalidateQueries({ queryKey: qk.journal.all }),
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn’t create that item.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-2 rounded-r2 border border-line bg-surface-muted p-3 text-fg" aria-label={`${label} preview`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">{created ? "Created" : `New ${label}`}</p>
      {action.kind !== "journal" && <p className="mt-1 font-semibold">{action.title}</p>}
      {preview && <p className="mt-1 whitespace-pre-wrap break-words text-sm text-fg-muted">{preview}</p>}
      {action.kind === "task" && action.due_date && <p className="mt-2 text-xs text-fg-muted">Due {action.due_date}</p>}
      {action.kind === "journal" && <p className="mt-2 text-xs text-fg-muted">For {action.entry_date}</p>}
      {created ? (
        <a className="btn btn-primary btn-sm mt-3 inline-flex" href={created.path}>
          Open {created.kind === "task" ? "to-do" : created.kind === "journal" ? "journal entry" : "note"}
        </a>
      ) : (
        <button className="btn btn-primary btn-sm mt-3" disabled={busy} onClick={create}>
          {busy ? "Creating…" : `Create ${label}`}
        </button>
      )}
      {error && <p className="mt-2 text-sm text-clay-fg" role="alert">{error}</p>}
    </section>
  );
}
