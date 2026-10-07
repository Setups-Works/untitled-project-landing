"use client";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

/**
 * One Server-Sent Events connection per tab (/api/v1/realtime) shared by every subscriber. The server only says "table X changed";
 * we then invalidate the matching query keys and TanStack Query refetches whatever is on screen, through the normal API, so
 * Row-Level Security still decides what is returned.
 */
type Fn = (table: string) => void;
const subs = new Set<Fn>();
let source: EventSource | null = null;

function connect() {
  if (source || typeof EventSource === "undefined") return;
  source = new EventSource("/api/v1/realtime");
  source.addEventListener("change", (e) => {
    try {
      const { t } = JSON.parse((e as MessageEvent<string>).data) as { t: string };
      subs.forEach((fn) => fn(t));
    } catch {
      /* ignore */
    }
  });
  // EventSource reconnects by itself after a drop; if the server rejects us (signed out) stop retrying.
  source.onerror = () => {
    if (source?.readyState === EventSource.CLOSED) source = null;
  };
}

function add(fn: Fn) {
  subs.add(fn);
  connect();
  return () => {
    subs.delete(fn);
    if (!subs.size) {
      source?.close();
      source = null;
    }
  };
}

/**
 *   useRealtimeInvalidate("tasks", [qk.tasks.all]);
 *
 * Bursts of events are coalesced into one refetch, so a bulk update doesn't cause a storm of requests.
 */
export function useRealtimeInvalidate(table: string, keys: QueryKey[], enabled = true) {
  const qc = useQueryClient();
  const keysRef = useRef(keys);
  keysRef.current = keys;

  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const off = add((t) => {
      if (t !== table) return;
      clearTimeout(timer);
      timer = setTimeout(() => keysRef.current.forEach((k) => qc.invalidateQueries({ queryKey: k })), 250);
    });
    return () => {
      clearTimeout(timer);
      off();
    };
  }, [qc, table, enabled]);
}
