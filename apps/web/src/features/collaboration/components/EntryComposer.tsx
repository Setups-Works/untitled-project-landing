"use client";
import { MAX_UPLOAD_BYTES, SHARED_JOURNAL as LIMIT } from "@untitled/logic";
import { useRef, useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faArrowUp, faPaperclip } from "@fortawesome/free-solid-svg-icons";
import FilePreviewList from "../../../components/ui/FilePreviewList";

/** Where a person writes a new entry: text and files. Resolves to true when the entry was saved, so the box can clear itself. */
export default function EntryComposer({ onSend }: { onSend: (body: string, files: File[]) => Promise<boolean> }) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const ta = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const canSend = (text.trim().length > 0 || files.length > 0) && !busy;

  function addFiles(list: FileList | null) {
    const picked = Array.from(list ?? []);
    const ok = picked.filter((f) => f.size <= MAX_UPLOAD_BYTES);
    setErr(ok.length < picked.length ? `Files can be up to ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.` : "");
    setFiles((cur) => [...cur, ...ok].slice(0, LIMIT.attachmentsMax));
  }

  async function send() {
    if (!canSend) return;
    setBusy(true);
    if (await onSend(text.trim(), files)) {
      setText("");
      setFiles([]);
      if (ta.current) ta.current.style.height = "";
    }
    setBusy(false);
  }

  return (
    <form
      className="jr-compose"
      onSubmit={(e) => {
        e.preventDefault();
        void send();
      }}
    >
      <FilePreviewList label="Attachments to add" files={files} onRemove={(i) => setFiles((cur) => cur.filter((_, j) => j !== i))} />
      <textarea
        ref={ta}
        value={text}
        rows={2}
        maxLength={LIMIT.bodyMax}
        placeholder="Write something for everyone here…"
        aria-label="New entry"
        onChange={(e) => {
          setText(e.target.value);
          e.target.style.height = "auto";
          e.target.style.height = `${Math.min(e.target.scrollHeight, 220)}px`;
        }}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            void send();
          }
        }}
      />
      {err && (
        <p className="form-err" role="alert">
          {err}
        </p>
      )}
      <div className="jr-bar">
        <button type="button" className="jr-pill" onClick={() => picker.current?.click()}>
          <FA icon={faPaperclip} /> Attach
        </button>
        <input
          ref={picker}
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
  );
}
