"use client";
import { useRef } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faArrowUp, faChevronDown, faPaperclip } from "@fortawesome/free-solid-svg-icons";
import type { Provider } from "../../../lib/ai";
import Menu, { MenuLabel, MenuRadioGroup, MenuRadioItem } from "../../ui/Menu";
import FilePreviewList from "../../ui/FilePreviewList";
import RecordButton from "../../ui/RecordButton";
import { useRecorder } from "../useRecorder";
import { useDraftFiles, useDraftText } from "../../../hooks/useDraft";

const MAX_BYTES = 10 * 1024 * 1024;

export default function Composer({
  busy,
  providers,
  provider,
  onProvider,
  onSend,
  onError,
  autoFocus,
  draftKey,
}: {
  busy: boolean;
  /** Every AI choice (the server decides which are available). */
  providers: Provider[];
  /** Id of the selected provider. */
  provider: string;
  onProvider: (id: string) => void;
  onSend: (text: string, files: File[]) => Promise<boolean>;
  onError: (m: string) => void;
  autoFocus?: boolean;
  /** Where the unsent message, attachments and voice recordings are kept so a refresh doesn't lose them (one per chat). */
  draftKey: string;
}) {
  const [text, setText] = useDraftText(draftKey);
  const [files, setFiles] = useDraftFiles(draftKey);
  const ta = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const current = providers.find((p) => p.id === provider) ?? providers[0];

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
      <FilePreviewList files={files} onRemove={(i) => setFiles((x) => x.filter((_, j) => j !== i))} />
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
          <MenuRadioGroup value={current.id} onValueChange={onProvider}>
            {providers.map((p) => (
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
        <RecordButton recording={rec.recording} secs={rec.secs} onToggle={rec.toggle} />
        <button className="jr-send" disabled={!canSend} aria-label="Send message" title="Send (Enter)">
          <FA icon={faArrowUp} />
        </button>
      </div>
    </form>
  );
}
