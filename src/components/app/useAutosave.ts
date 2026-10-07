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
    const t = setTimeout(async () => {
      try {
        await saveRef.current(value);
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    }, delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, delay]);

  return status;
}

export const statusText = (s: "idle" | "saving" | "saved" | "error") =>
  s === "saving" ? "Saving…" : s === "saved" ? "Saved" : s === "error" ? "Couldn’t save — check your connection" : "";
