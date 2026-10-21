"use client";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faCheck, faCopy, faStop, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import AiIcon from "../ui/AiIcon";
import Markdown from "./Markdown";

/** The AI's answer for a note: shown as it arrives, then applied (replace or insert below), copied or discarded. */
export default function NoteAiPanel({
  title,
  text,
  busy,
  canReplace,
  replaceLabel,
  onReplace,
  onInsert,
  onStop,
  onClose,
}: {
  title: string;
  text: string;
  busy: boolean;
  canReplace: boolean;
  replaceLabel: string;
  onReplace: () => void;
  onInsert: () => void;
  onStop: () => void;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked: nothing to do */
    }
  };
  return (
    <section className="mx-4 mb-2 flex max-h-[45%] flex-col gap-2 overflow-hidden rounded-r3 bg-surface p-3 shadow-e1" aria-label="AI result">
      <div className="flex items-center gap-2 text-sm text-fg-muted">
        <AiIcon className="h-[16px] w-[10px]" />
        <b className="flex-1 font-medium text-fg">{title}</b>
        <button type="button" className="ne-btn" aria-label="Close AI result" onClick={onClose}>
          <FA icon={faXmark} />
        </button>
      </div>
      <div className="min-h-8 overflow-y-auto text-sm" aria-live="polite" aria-busy={busy}>
        {text ? <Markdown text={text} /> : <span className="text-fg-muted">Thinking…</span>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {busy ? (
          <button type="button" className="btn btn-secondary btn-sm" onClick={onStop}>
            <FA icon={faStop} /> Stop
          </button>
        ) : (
          text && (
            <>
              {canReplace && (
                <button type="button" className="btn btn-primary btn-sm" onClick={onReplace}>
                  <FA icon={faCheck} /> {replaceLabel}
                </button>
              )}
              <button type="button" className={`btn btn-sm ${canReplace ? "btn-secondary" : "btn-primary"}`} onClick={onInsert}>
                Insert below
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={copy}>
                <FA icon={faCopy} /> {copied ? "Copied" : "Copy"}
              </button>
            </>
          )
        )}
      </div>
    </section>
  );
}
