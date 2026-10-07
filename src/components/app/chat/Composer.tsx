"use client";
import { useRef, useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faArrowUp, faChevronDown, faMicrophone, faPaperclip, faStop, faXmark } from "@fortawesome/free-solid-svg-icons";
import { PROVIDERS } from "../../../lib/ai";
import Menu, { MenuLabel, MenuRadioGroup, MenuRadioItem } from "../../ui/Menu";
import { useRecorder } from "../useRecorder";

const MAX_BYTES = 10 * 1024 * 1024;

export default function Composer({
  busy,
  provider,
  onSend,
  onError,
  autoFocus,
}: {
  busy: boolean;
  provider: string;
  onSend: (text: string, files: File[]) => Promise<boolean>;
  onError: (m: string) => void;
  autoFocus?: boolean;
}) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const ta = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const current = PROVIDERS.find((p) => p.id === provider) ?? PROVIDERS[0];

  const rec = useRecorder((blob, type, secs) => {
    setFiles((f) => [...f, new File([blob], `voice-note-${secs}s.${type.includes("mp4") ? "m4a" : "webm"}`, { type })]);
  }, onError);

  const addFiles = (list: FileList | null) => {
    const picked = Array.from(list ?? []);
    const ok = picked.filter((f) => f.size <= MAX_BYTES);
    if (ok.length < picked.length) onError("Files can be up to 10 MB.");
    setFiles((f) => [...f, ...ok]);
  };

  const canSend = (text.trim() || files.length) && !busy;
  async function submit() {
    if (!canSend) return;
    const done = await onSend(text.trim(), files);
    if (done) {
      setText("");
      setFiles([]);
      if (ta.current) ta.current.style.height = "";
    }
  }

  return (
    <form
      className="cx-composer"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      {files.length > 0 && (
        <ul className="jr-pending" aria-label="Attachments to send">
          {files.map((f, i) => (
            <li key={`${f.name}${i}`}>
              {f.type.startsWith("audio/") ? <FA icon={faMicrophone} /> : <FA icon={faPaperclip} />} <span>{f.name}</span>
              <button type="button" aria-label={`Remove ${f.name}`} onClick={() => setFiles((x) => x.filter((_, j) => j !== i))}>
                <FA icon={faXmark} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <textarea
        ref={ta}
        value={text}
        rows={1}
        maxLength={20000}
        autoFocus={autoFocus}
        placeholder="Ask anything…"
        aria-label="Message"
        onChange={(e) => {
          setText(e.target.value);
          e.target.style.height = "auto";
          e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
      />
      <div className="cx-bar">
        <button type="button" className="ne-btn" aria-label="Attach files" onClick={() => picker.current?.click()}>
          <FA icon={faPaperclip} />
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
        <Menu
          label="Choose AI"
          side="top"
          align="start"
          className="cx-model"
          trigger={
            <>
              {current.label} <FA icon={faChevronDown} />
            </>
          }
        >
          <MenuLabel>AI</MenuLabel>
          <MenuRadioGroup
            value={current.id}
            onValueChange={() => {
              /* only "No AI" can be selected until a provider is connected */
            }}
          >
            {PROVIDERS.map((p) => (
              <MenuRadioItem key={p.id} value={p.id} disabled={!p.available}>
                <span className="cx-prov">
                  <b>{p.label}</b>
                  <small>{p.available ? p.note : "Not connected yet"}</small>
                </span>
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
        </Menu>
        <span className="cx-spacer" />
        <button
          type="button"
          className="ne-btn"
          data-on={rec.recording}
          aria-pressed={rec.recording}
          aria-label={rec.recording ? "Stop recording" : "Record a voice message"}
          onClick={rec.toggle}
        >
          <FA icon={rec.recording ? faStop : faMicrophone} />
          {rec.recording && (
            <small className="cx-rec">
              {Math.floor(rec.secs / 60)}:{String(rec.secs % 60).padStart(2, "0")}
            </small>
          )}
        </button>
        <button className="jr-send" disabled={!canSend} aria-label="Send message" title="Send (Enter)">
          <FA icon={faArrowUp} />
        </button>
      </div>
    </form>
  );
}
