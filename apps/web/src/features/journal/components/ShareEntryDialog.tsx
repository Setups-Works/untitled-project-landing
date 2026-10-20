"use client";
import { journalShareUrl } from "@untitled/api-client";
import { useEffect, useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faCheck, faCopy, faDownload, faLink, faLinkSlash, faShareNodes, faXmark } from "@fortawesome/free-solid-svg-icons";
import Modal from "../../../components/ui/Modal";
import { fmtTime } from "../../../lib/prefs";
import { useEntryShare } from "../hooks/useEntryShare";
import { renderEntryCard } from "../lib/entryCard";

type Props = {
  entry: { id: string; entry_date: string; body: string; created_at: string; share_token?: string | null };
  onClose: () => void;
};

const SECTION = "text-[11px] font-semibold tracking-[0.1em] uppercase text-fg-faint";
const FILE_NAME = "journal-entry.png";

const dayLabel = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
};

/**
 * Share one journal entry: a secret link anyone can open (read-only, no name, switched off any time), or a picture of the entry to send
 * or save. The link is the only way an entry leaves the private journal, so turning it on is always an explicit step.
 */
export default function ShareEntryDialog({ entry, onClose }: Props) {
  const [token, setToken] = useState(entry.share_token ?? null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [image, setImage] = useState<{ blob: Blob; url: string } | null>(null);
  const setShared = useEntryShare(setErr);
  const url = token ? journalShareUrl(window.location.origin, token) : "";

  // The picture is drawn once when the dialog opens, so Share and Download are instant.
  useEffect(() => {
    let live = true;
    let made = "";
    void renderEntryCard({ dayLabel: dayLabel(entry.entry_date), timeLabel: fmtTime(entry.created_at), body: entry.body }).then((blob) => {
      if (!live || !blob) return;
      made = URL.createObjectURL(blob);
      setImage({ blob, url: made });
    });
    return () => {
      live = false;
      if (made) URL.revokeObjectURL(made);
    };
  }, [entry.entry_date, entry.created_at, entry.body]);

  async function toggle(on: boolean) {
    setBusy(true);
    setErr("");
    const next = await setShared(entry.id, on);
    if (next !== undefined) setToken(next);
    setBusy(false);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setErr("Couldn’t copy. Select the link and copy it by hand.");
    }
  }

  function download() {
    if (!image) return;
    const a = document.createElement("a");
    a.href = image.url;
    a.download = FILE_NAME;
    a.click();
  }

  async function shareImage() {
    if (!image) return;
    const file = new File([image.blob], FILE_NAME, { type: "image/png" });
    const data: ShareData = { files: [file], title: "Journal entry" };
    if (typeof navigator.share === "function" && navigator.canShare?.(data)) {
      try {
        await navigator.share(data);
      } catch {
        /* the person closed the share sheet */
      }
      return;
    }
    download(); // browsers that can't share files (most desktops) save it instead
  }

  return (
    <Modal label="Share entry" onClose={onClose} size="md">
      <div className="td">
        <div className="td-head">
          <h2 className="h3">Share entry</h2>
          <button type="button" className="ne-btn" aria-label="Close" onClick={onClose}>
            <FA icon={faXmark} />
          </button>
        </div>

        <div className="flex flex-col gap-5">
          <section className="flex flex-col gap-2.5">
            <h3 className={SECTION}>Link</h3>
            {token ? (
              <>
                <p className="text-[13.5px] text-fg-subtle">
                  Anyone with this link can read this entry. It shows no name, and you can switch it off at any time.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="tf-pill min-w-[200px] flex-1">
                    <FA icon={faLink} aria-hidden />
                    <input
                      className="w-full cursor-text"
                      readOnly
                      value={url}
                      aria-label="Public link"
                      onFocus={(e) => e.currentTarget.select()}
                    />
                  </label>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => void copy()}>
                    <FA icon={copied ? faCheck : faCopy} aria-hidden /> {copied ? "Copied" : "Copy link"}
                  </button>
                </div>
                <button type="button" className="btn btn-secondary btn-sm w-fit" disabled={busy} onClick={() => void toggle(false)}>
                  <FA icon={faLinkSlash} aria-hidden /> Stop sharing
                </button>
              </>
            ) : (
              <>
                <p className="text-[13.5px] text-fg-subtle">
                  Make a secret link to this one entry. Nothing else in your journal is shared.
                </p>
                <button type="button" className="btn btn-secondary btn-sm w-fit" disabled={busy} onClick={() => void toggle(true)}>
                  <FA icon={faLink} aria-hidden /> Create link
                </button>
              </>
            )}
          </section>

          <section className="flex flex-col gap-2.5">
            <h3 className={SECTION}>Image</h3>
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image.url}
                alt="Preview of the entry as a picture"
                className="max-h-[320px] w-full rounded-r3 object-contain object-top shadow-e1"
              />
            ) : (
              <p className="ap-none">Preparing the picture…</p>
            )}
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-primary btn-sm" disabled={!image} onClick={() => void shareImage()}>
                <FA icon={faShareNodes} aria-hidden /> Share image
              </button>
              <button type="button" className="btn btn-secondary btn-sm" disabled={!image} onClick={download}>
                <FA icon={faDownload} aria-hidden /> Download
              </button>
            </div>
          </section>

          {err && (
            <p className="form-err" role="alert">
              {err}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
