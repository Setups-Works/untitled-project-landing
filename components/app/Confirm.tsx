"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faTrash, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

type Options = { title: string; body?: ReactNode; confirmLabel?: string; danger?: boolean };
type Pending = Options & { resolve: (ok: boolean) => void };

function Dialog({ title, body, confirmLabel = "Confirm", danger, resolve }: Pending) {
  const cancel = useRef<HTMLButtonElement>(null);
  const ok = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    cancel.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") resolve(false);
      if (e.key === "Tab") {
        // keep focus inside the dialog
        e.preventDefault();
        (document.activeElement === cancel.current ? ok.current : cancel.current)?.focus();
      }
    };
    document.addEventListener("keydown", key);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = prevOverflow;
      prev?.focus?.();
    };
  }, [resolve]);

  return createPortal(
    <div className="cd-back" onMouseDown={(e) => { if (e.target === e.currentTarget) resolve(false); }}>
      <div className="cd" role="alertdialog" aria-modal="true" aria-labelledby="cd-t" aria-describedby="cd-b" data-danger={danger}>
        <span className="cd-ico"><FA icon={danger ? faTrash : faTriangleExclamation} /></span>
        <h2 id="cd-t" className="h3">{title}</h2>
        {body && <p id="cd-b" className="body">{body}</p>}
        <div className="cd-acts">
          <button ref={cancel} className="btn btn-secondary btn-sm" onClick={() => resolve(false)}>Cancel</button>
          <button ref={ok} className="btn btn-primary btn-sm cd-ok" onClick={() => resolve(true)}>{confirmLabel}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

type PromptOptions = {
  title: string; body?: ReactNode; label: string; placeholder?: string; initial?: string; confirmLabel?: string;
  /** Return an error message to keep the dialog open, or null when the value is fine. */
  validate?: (value: string) => string | null;
};
type PromptPending = PromptOptions & { resolve: (value: string | null) => void };

function PromptDialog({ title, body, label, placeholder, initial = "", confirmLabel = "OK", validate, resolve }: PromptPending) {
  const [value, setValue] = useState(initial);
  const [err, setErr] = useState("");

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") resolve(null); };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = prevOverflow;
      prev?.focus?.();
    };
  }, [resolve]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = value.trim();
    const problem = validate?.(v) ?? (v ? null : "Please enter a value.");
    if (problem) return setErr(problem);
    resolve(v);
  }

  return createPortal(
    <div className="cd-back" onMouseDown={(e) => { if (e.target === e.currentTarget) resolve(null); }}>
      <form className="cd" role="dialog" aria-modal="true" aria-labelledby="pd-t" onSubmit={submit}>
        <h2 id="pd-t" className="h3">{title}</h2>
        {body && <p className="body">{body}</p>}
        <label className="cd-field">
          <span>{label}</span>
          <input autoFocus value={value} onChange={(e) => { setValue(e.target.value); setErr(""); }} placeholder={placeholder} aria-invalid={!!err} aria-describedby={err ? "pd-e" : undefined} />
        </label>
        {err && <p id="pd-e" className="form-err" role="alert">{err}</p>}
        <div className="cd-acts">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => resolve(null)}>Cancel</button>
          <button className="btn btn-primary btn-sm">{confirmLabel}</button>
        </div>
      </form>
    </div>,
    document.body,
  );
}

/** `const { prompt, dialog } = usePrompt()` — render {dialog} once, then `const v = await prompt({...})` (null if cancelled). */
export function usePrompt() {
  const [pending, setPending] = useState<PromptPending | null>(null);
  const prompt = useCallback(
    (o: PromptOptions) => new Promise<string | null>((resolve) => setPending({ ...o, resolve })),
    [],
  );
  const settle = useCallback((v: string | null) => {
    setPending((p) => { p?.resolve(v); return null; });
  }, []);
  const dialog = pending ? <PromptDialog {...pending} resolve={settle} /> : null;
  return { prompt, dialog };
}

/** `const { ask, dialog } = useConfirm()` — render {dialog} once, then `if (!(await ask({...}))) return;`. */
export function useConfirm() {
  const [pending, setPending] = useState<Pending | null>(null);
  const ask = useCallback(
    (o: Options) => new Promise<boolean>((resolve) => setPending({ ...o, resolve })),
    [],
  );
  const settle = useCallback((ok: boolean) => {
    setPending((p) => { p?.resolve(ok); return null; });
  }, []);
  const dialog = pending ? <Dialog {...pending} resolve={settle} /> : null;
  return { ask, dialog };
}
