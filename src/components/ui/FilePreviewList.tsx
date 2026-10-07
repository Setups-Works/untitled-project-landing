"use client";
import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faFile, faFileLines, faFilePdf, faMagnifyingGlassPlus, faMicrophone, faXmark } from "@fortawesome/free-solid-svg-icons";
import Modal from "./Modal";

const size = (n: number) => (n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${Math.round(n / 1024)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);
const kind = (f: File) =>
  f.type.startsWith("image/")
    ? "image"
    : f.type.startsWith("audio/")
      ? "audio"
      : f.type.startsWith("video/")
        ? "video"
        : f.type === "application/pdf"
          ? "pdf"
          : "file";

/**
 * Files the user has picked but not sent yet, shown as cards: a thumbnail for images, a player for audio, an icon for the rest.
 * Click an image (or the magnifier) to see it large before sending. Object URLs are created here and revoked when files change.
 *
 *   <FilePreviewList files={files} onRemove={(i) => setFiles((x) => x.filter((_, j) => j !== i))} />
 */
export default function FilePreviewList({
  files,
  onRemove,
  label = "Attachments to send",
}: {
  files: File[];
  onRemove: (index: number) => void;
  label?: string;
}) {
  const urls = useMemo(
    () => files.map((f) => (/^(image|audio|video)\//.test(f.type) || f.type === "application/pdf" ? URL.createObjectURL(f) : null)),
    [files],
  );
  useEffect(() => () => urls.forEach((u) => u && URL.revokeObjectURL(u)), [urls]);
  const [open, setOpen] = useState<number | null>(null);
  const current = open !== null && files[open] ? { file: files[open], url: urls[open] } : null;

  if (!files.length) return null;
  return (
    <>
      <ul className="mb-2 flex flex-wrap gap-2" aria-label={label}>
        {files.map((f, i) => {
          const k = kind(f);
          const url = urls[i];
          return (
            <li
              key={`${f.name}${f.size}${i}`}
              className="flex w-full max-w-[380px] items-center gap-3 rounded-r3 bg-white p-2 pr-2.5 shadow-[inset_0_0_0_1px_var(--line)]"
            >
              {k === "image" && url ? (
                <button
                  type="button"
                  onClick={() => setOpen(i)}
                  aria-label={`Preview ${f.name}`}
                  className="group relative size-14 flex-none overflow-hidden rounded-r2 bg-surface-sunken"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="size-full object-cover" />
                  <span className="absolute inset-0 grid place-items-center bg-black/35 text-[13px] text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    <FA icon={faMagnifyingGlassPlus} />
                  </span>
                </button>
              ) : (
                <span className="grid size-14 flex-none place-items-center rounded-r2 bg-surface-sunken text-[20px] text-fg-muted">
                  <FA icon={k === "audio" ? faMicrophone : k === "pdf" ? faFilePdf : k === "video" ? faFileLines : faFile} />
                </span>
              )}
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-[13px] font-medium text-fg">{f.name}</span>
                <span className="block text-[12px] text-fg-subtle">{size(f.size)}</span>
                {k === "audio" && url && <audio controls src={url} aria-label={f.name} className="mt-1 h-8 w-full" />}
              </span>
              {(k === "pdf" || k === "video") && url && (
                <button
                  type="button"
                  onClick={() => setOpen(i)}
                  className="rounded-pill px-3 py-1 text-[12px] text-fg-muted shadow-[inset_0_0_0_1px_var(--line)] hover:bg-surface-muted"
                >
                  Preview
                </button>
              )}
              <button
                type="button"
                aria-label={`Remove ${f.name}`}
                onClick={() => onRemove(i)}
                className="grid size-7 flex-none place-items-center rounded-full text-[12px] text-fg-subtle hover:bg-surface-muted hover:text-fg"
              >
                <FA icon={faXmark} />
              </button>
            </li>
          );
        })}
      </ul>

      {current && (
        <Modal label={`Preview of ${current.file.name}`} onClose={() => setOpen(null)} size="lg">
          <div className="p-4">
            <div className="grid max-h-[70vh] place-items-center overflow-auto rounded-r3 bg-surface-sunken">
              {current.url && kind(current.file) === "image" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={current.url} alt={current.file.name} className="max-h-[70vh] max-w-full object-contain" />
              )}
              {current.url && kind(current.file) === "video" && <video controls src={current.url} className="max-h-[70vh] max-w-full" />}
              {current.url && kind(current.file) === "pdf" && (
                <iframe src={current.url} title={current.file.name} className="h-[70vh] w-full" />
              )}
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-medium">{current.file.name}</span>
                <span className="block text-[12px] text-fg-subtle">
                  {current.file.type || "Unknown type"} · {size(current.file.size)}
                </span>
              </span>
              <span className="flex flex-none gap-2">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(null)}>
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    onRemove(open!);
                    setOpen(null);
                  }}
                >
                  Remove
                </button>
              </span>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
