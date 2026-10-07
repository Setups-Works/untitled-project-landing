"use client";
import { useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faCheck, faCopy, faEarthAmericas, faLock, faXmark } from "@fortawesome/free-solid-svg-icons";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Chat } from "../../../lib/workspace";
import Modal from "../../ui/Modal";

/** Turn a public, read-only link for a chat on or off. */
export default function ShareDialog({
  chat,
  sb,
  onClose,
  onChange,
}: {
  chat: Chat;
  sb: SupabaseClient;
  onClose: () => void;
  onChange: (token: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState("");
  const link = chat.share_token ? `${location.origin}/share/${chat.share_token}` : "";

  async function setShared(on: boolean) {
    setBusy(true);
    setErr("");
    const token = on ? crypto.randomUUID().replaceAll("-", "") : null;
    const { error } = await sb
      .from("chats")
      .update({ share_token: token, shared_at: on ? new Date().toISOString() : null })
      .eq("id", chat.id);
    setBusy(false);
    if (error) return setErr("Couldn’t change sharing. Please try again.");
    onChange(token);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setErr("Couldn’t copy. Select the link and copy it manually.");
    }
  }

  return (
    <Modal label="Share chat" onClose={onClose} size="sm">
      <div className="td">
        <div className="td-head">
          <h2 className="h3">Share chat</h2>
          <button className="ne-btn" aria-label="Close" onClick={onClose}>
            <FA icon={faXmark} />
          </button>
        </div>

        <div className="sh-state" data-on={!!chat.share_token}>
          <span>
            <FA icon={chat.share_token ? faEarthAmericas : faLock} />
          </span>
          <div>
            <b>{chat.share_token ? "Anyone with the link can view" : "Only you can see this chat"}</b>
            <small>
              {chat.share_token
                ? "They can read the whole conversation but not change it."
                : "Create a link to share the whole conversation."}
            </small>
          </div>
        </div>

        {chat.share_token ? (
          <>
            <div className="sh-link">
              <input readOnly value={link} aria-label="Public link" onFocus={(e) => e.currentTarget.select()} />
              <button className="btn btn-primary btn-sm" onClick={copy}>
                <FA icon={copied ? faCheck : faCopy} /> {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="meta">
              The link shows every message and attachment in this chat, including ones you add later. Your name and email aren’t shown.
            </p>
            <div className="tf-acts">
              <button className="btn btn-secondary btn-sm td-del" disabled={busy} onClick={() => setShared(false)}>
                Stop sharing
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="meta">
              Anyone who has the link will be able to open it — no account needed. You can stop sharing at any time and the link will stop
              working.
            </p>
            <div className="tf-acts">
              <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => setShared(true)}>
                {busy ? "Creating…" : "Create public link"}
              </button>
            </div>
          </>
        )}
        {err && (
          <p className="form-err" role="alert">
            {err}
          </p>
        )}
      </div>
    </Modal>
  );
}
