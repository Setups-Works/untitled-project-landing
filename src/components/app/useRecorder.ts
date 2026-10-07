"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/** Records microphone audio. Calls onDone with the finished clip when stopped. */
export function useRecorder(onDone: (blob: Blob, type: string, secs: number) => void, onError: (msg: string) => void) {
  const [recording, setRecording] = useState(false);
  const [secs, setSecs] = useState(0);
  const rec = useRef<MediaRecorder | null>(null);
  const done = useRef(onDone);
  done.current = onDone;

  const toggle = useCallback(async () => {
    if (rec.current?.state === "recording") return rec.current.stop();
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      return onError("Microphone access was blocked. Allow it in your browser to record voice.");
    }
    const r = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    let n = 0;
    r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const timer = setInterval(() => setSecs(++n), 1000);
    r.onstop = () => {
      clearInterval(timer);
      stream.getTracks().forEach((t) => t.stop());
      setRecording(false);
      setSecs(0);
      const type = (r.mimeType || "audio/webm").split(";")[0];
      const blob = new Blob(chunks, { type });
      if (blob.size) done.current(blob, type, n);
    };
    rec.current = r;
    setSecs(0);
    setRecording(true);
    r.start();
  }, [onError]);

  useEffect(
    () => () => {
      if (rec.current?.state === "recording") rec.current.stop();
    },
    [],
  );
  return { recording, secs, toggle };
}
