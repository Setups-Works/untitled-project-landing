"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faRss } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

/**
 * Asks for a feed or website address. Built like the app's prompt dialog (`cd` classes) so it looks the same, and stays open
 * with the reason when the address can't be followed.
 */
export default function AddFeedDialog({ onAdd, onClose }: { onAdd: (url: string) => Promise<{ error?: string } | void>; onClose: () => void }) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || busy) return;
    setBusy(true);
    setError("");
    const res = await onAdd(url.trim());
    setBusy(false);
    if (res?.error) setError(res.error);
    else onClose();
  }

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="cd-back">
          <Dialog.Content className="cd">
            <form onSubmit={submit} className="cd-form">
              <span className="at-green tint mb-1 grid size-12 place-items-center rounded-r3 text-[18px]" aria-hidden>
                <FA icon={faRss} />
              </span>
              <Dialog.Title className="h3">Add a feed</Dialog.Title>
              <Dialog.Description className="body">Paste a feed address, or just a website: we’ll look for its feed.</Dialog.Description>
              <label className="cd-field">
                <span>Feed or website address</span>
                <input
                  autoFocus
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setError("");
                  }}
                  type="text"
                  inputMode="url"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="example.com/feed.xml"
                  aria-invalid={!!error}
                  aria-describedby={error ? "af-err" : undefined}
                />
              </label>
              {error && (
                <p id="af-err" className="form-err" role="alert">
                  {error}
                </p>
              )}
              <div className="cd-acts">
                <Dialog.Close asChild>
                  <button type="button" className="btn btn-secondary btn-sm">
                    Cancel
                  </button>
                </Dialog.Close>
                <button className="btn btn-primary btn-sm" disabled={busy || !url.trim()}>
                  {busy ? "Adding…" : "Add feed"}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
