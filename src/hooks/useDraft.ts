"use client";
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { readFiles, readText, writeFiles, writeText } from "../lib/drafts";

/**
 * Like `useState("")`, but the value survives a refresh. Give each input its own key (e.g. `journal:2026-10-07`, `chat:<id>`);
 * when the key changes the draft for the new key is loaded. Clear it the normal way (`setValue("")`) after sending.
 */
export function useDraftText(key: string, initial = ""): [string, Dispatch<SetStateAction<string>>] {
  const [value, setValue] = useState(initial);
  const loadedKey = useRef<string | null>(null);

  const skipNextWrite = useRef(false);

  useEffect(() => {
    const stored = readText(key) ?? initial;
    // The write effect below runs in the same pass with the old value; it must not overwrite the draft we are about to show.
    skipNextWrite.current = stored !== value;
    setValue(stored);
    loadedKey.current = key;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `value` is only read to decide whether a re-render follows
  }, [key, initial]);

  // Written on every change: localStorage is synchronous and tiny, and writing immediately means a refresh, a tab close or the
  // component unmounting (e.g. right after a message is sent) can never leave a stale or missing draft behind.
  useEffect(() => {
    if (loadedKey.current !== key) return;
    if (skipNextWrite.current) {
      skipNextWrite.current = false;
      return;
    }
    writeText(key, value);
  }, [key, value]);

  return [value, setValue];
}

/** Like `useState<File[]>([])`, but attached files and voice recordings survive a refresh (stored in IndexedDB). */
export function useDraftFiles(key: string): [File[], Dispatch<SetStateAction<File[]>>] {
  const [files, setFiles] = useState<File[]>([]);
  const loadedKey = useRef<string | null>(null);

  useEffect(() => {
    let live = true;
    loadedKey.current = null;
    setFiles([]);
    readFiles(key).then((saved) => {
      if (!live) return;
      // Anything added while the saved files were loading wins; otherwise restore what was saved.
      setFiles((now) => (now.length ? now : saved));
      loadedKey.current = key;
    });
    return () => {
      live = false;
    };
  }, [key]);

  useEffect(() => {
    if (loadedKey.current !== key) return;
    void writeFiles(key, files);
  }, [key, files]);

  return [files, setFiles];
}
