"use client";
import { useEffect, useRef, useState } from "react";

/** Calls save(value) shortly after the value stops changing. The first value is never saved. */
export function useAutosave<T>(value: T, save: (v: T) => Promise<unknown>, delay = 800, resetKey?: unknown) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const first = useRef(true);
  const saveRef = useRef(save);
  saveRef.current = save;

  useEffect(() => {
    first.current = true;
    setStatus("idle");
  }, [resetKey]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setStatus("saving");
    let live = true;
    let retry: ReturnType<typeof setTimeout> | undefined;
    // A failed save (a dropped connection, the server restarting) is retried a few times before the person is told.
    const attempt = async (left: number) => {
      try {
        await saveRef.current(value);
        if (live) setStatus("saved");
      } catch {
        if (!live) return;
        if (left > 0) retry = setTimeout(() => void attempt(left - 1), 2000);
        else setStatus("error");
      }
    };
    const t = setTimeout(() => void attempt(3), delay);
    return () => {
      live = false;
      clearTimeout(t);
      clearTimeout(retry);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, delay]);

  return status;
}

export const statusText = (s: "idle" | "saving" | "saved" | "error") =>
  s === "saving" ? "Saving…" : s === "saved" ? "Saved" : s === "error" ? "Couldn’t save — check your connection" : "";
