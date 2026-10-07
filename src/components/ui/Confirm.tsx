"use client";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as Dialog from "@radix-ui/react-dialog";
import { useCallback, useState, type ReactNode } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faTrash, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

/*
 * Promise-based replacements for window.confirm / window.prompt, on Radix AlertDialog and Dialog:
 *   const { ask, dialog } = useConfirm();     render {dialog} once, then:  if (!(await ask({ title, body, danger }))) return;
 *   const { prompt, dialog } = usePrompt();   const value = await prompt({ title, label, validate });  // null if cancelled
 * AlertDialog gives the correct semantics for confirmations (role="alertdialog", focus starts on Cancel so Enter can't delete by accident).
 */

type Options = { title: string; body?: ReactNode; confirmLabel?: string; danger?: boolean };
type Pending = Options & { resolve: (ok: boolean) => void };

function ConfirmDialog({ title, body, confirmLabel = "Confirm", danger, resolve }: Pending) {
  return (
    <AlertDialog.Root
      open
      onOpenChange={(open) => {
        if (!open) resolve(false);
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="cd-back">
          <AlertDialog.Content className="cd" data-danger={danger}>
            <span className="cd-ico">
              <FA icon={danger ? faTrash : faTriangleExclamation} />
            </span>
            <AlertDialog.Title className="h3">{title}</AlertDialog.Title>
            {body ? (
              <AlertDialog.Description className="body">{body}</AlertDialog.Description>
            ) : (
              <AlertDialog.Description className="sr-only">{title}</AlertDialog.Description>
            )}
            <div className="cd-acts">
              <AlertDialog.Cancel asChild>
                <button className="btn btn-secondary btn-sm">Cancel</button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button className="btn btn-primary btn-sm cd-ok" onClick={() => resolve(true)}>
                  {confirmLabel}
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Overlay>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

/** `const { ask, dialog } = useConfirm()` — render {dialog} once, then `if (!(await ask({...}))) return;`. */
export function useConfirm() {
  const [pending, setPending] = useState<Pending | null>(null);
  const ask = useCallback((o: Options) => new Promise<boolean>((resolve) => setPending({ ...o, resolve })), []);
  const settle = useCallback((ok: boolean) => {
    setPending((p) => {
      p?.resolve(ok);
      return null;
    });
  }, []);
  const dialog = pending ? <ConfirmDialog {...pending} resolve={settle} /> : null;
  return { ask, dialog };
}

type PromptOptions = {
  title: string;
  body?: ReactNode;
  label: string;
  placeholder?: string;
  initial?: string;
  confirmLabel?: string;
  /** Return an error message to keep the dialog open, or null when the value is fine. */
  validate?: (value: string) => string | null;
};
type PromptPending = PromptOptions & { resolve: (value: string | null) => void };

function PromptDialog({ title, body, label, placeholder, initial = "", confirmLabel = "OK", validate, resolve }: PromptPending) {
  const [value, setValue] = useState(initial);
  const [err, setErr] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = value.trim();
    const problem = validate?.(v) ?? (v ? null : "Please enter a value.");
    if (problem) return setErr(problem);
    resolve(v);
  }

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) resolve(null);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="cd-back">
          <Dialog.Content className="cd">
            <form onSubmit={submit} className="cd-form">
              <Dialog.Title className="h3">{title}</Dialog.Title>
              {body ? (
                <Dialog.Description className="body">{body}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
              <label className="cd-field">
                <span>{label}</span>
                <input
                  autoFocus
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    setErr("");
                  }}
                  placeholder={placeholder}
                  aria-invalid={!!err}
                  aria-describedby={err ? "pd-e" : undefined}
                />
              </label>
              {err && (
                <p id="pd-e" className="form-err" role="alert">
                  {err}
                </p>
              )}
              <div className="cd-acts">
                <Dialog.Close asChild>
                  <button type="button" className="btn btn-secondary btn-sm">
                    Cancel
                  </button>
                </Dialog.Close>
                <button className="btn btn-primary btn-sm">{confirmLabel}</button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** `const { prompt, dialog } = usePrompt()` — render {dialog} once, then `const v = await prompt({...})` (null if cancelled). */
export function usePrompt() {
  const [pending, setPending] = useState<PromptPending | null>(null);
  const prompt = useCallback((o: PromptOptions) => new Promise<string | null>((resolve) => setPending({ ...o, resolve })), []);
  const settle = useCallback((v: string | null) => {
    setPending((p) => {
      p?.resolve(v);
      return null;
    });
  }, []);
  const dialog = pending ? <PromptDialog {...pending} resolve={settle} /> : null;
  return { prompt, dialog };
}
