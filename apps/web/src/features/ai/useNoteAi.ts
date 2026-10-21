"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export type NoteAiAction = "improve" | "fix" | "shorter" | "longer" | "summarize" | "actions" | "continue" | "custom";

/** What the AI produced for one piece of the note, and which part of the note it came from. */
export type NoteAiResult = { action: NoteAiAction; text: string; from: number; to: number };

/**
 * Runs an AI action on part of a note through `/api/v1/ai/note` and shows the answer as it streams in. Nothing is changed in
 * the note here: the editor decides what to do with the result.
 */
export function useNoteAi(provider: string) {
  const [result, setResult] = useState<NoteAiResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const ctl = useRef<AbortController | null>(null);

  const stop = useCallback(() => ctl.current?.abort(), []);
  const clear = useCallback(() => {
    ctl.current?.abort();
    setResult(null);
    setErr("");
  }, []);
  useEffect(() => () => ctl.current?.abort(), []);

  const run = useCallback(
    async (action: NoteAiAction, text: string, range: [number, number], instruction?: string) => {
      ctl.current?.abort();
      const c = new AbortController();
      ctl.current = c;
      setErr("");
      setBusy(true);
      setResult({ action, text: "", from: range[0], to: range[1] });
      try {
        const res = await fetch("/api/v1/ai/note", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action, text, instruction, provider: provider === "none" ? undefined : provider }),
          signal: c.signal,
        });
        if (!res.ok || !res.body) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          setResult(null);
          return setErr(j.error ?? "The AI couldn’t do that. Try again.");
        }
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let out = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          out += dec.decode(value, { stream: true });
          setResult({ action, text: out, from: range[0], to: range[1] });
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setResult(null);
          setErr("The AI couldn’t do that. Try again.");
        }
      } finally {
        if (ctl.current === c) setBusy(false);
      }
    },
    [provider],
  );

  return { result, busy, err, run, stop, clear };
}
