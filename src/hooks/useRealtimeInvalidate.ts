"use client";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { supabaseBrowser } from "../lib/supabase/client";

/**
 * Keeps cached queries fresh when rows change anywhere (another tab, another device, a teammate).
 * Subscribes to Supabase Realtime for a table and invalidates the given query keys; TanStack Query then refetches only
 * the queries that are on screen. Row-Level Security applies to realtime too, so you only hear about rows you may read.
 *
 *   useRealtimeInvalidate("tasks", [qk.tasks.all]);
 *
 * The table must be in the `supabase_realtime` publication (see the realtime migration). Bursts of events are
 * coalesced into one refetch, so a bulk update doesn't cause a storm of requests.
 */
export function useRealtimeInvalidate(table: string, keys: QueryKey[], enabled = true) {
  const qc = useQueryClient();
  const keysRef = useRef(keys);
  keysRef.current = keys;

  useEffect(() => {
    if (!enabled) return;
    const sb = supabaseBrowser();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const channel = sb
      .channel(`rt:${table}:${Math.random().toString(36).slice(2, 8)}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => {
        clearTimeout(timer);
        timer = setTimeout(() => keysRef.current.forEach((k) => qc.invalidateQueries({ queryKey: k })), 250);
      })
      .subscribe();
    return () => {
      clearTimeout(timer);
      sb.removeChannel(channel);
    };
  }, [qc, table, enabled]);
}
