import "server-only";
import pg from "pg";
import { requireEnv } from "../config/env";

/**
 * Realtime without a third-party service: Postgres triggers `pg_notify('row_changes', {t: table, u: owner})` on every write
 * (see the realtime migration). One long-lived connection per server process LISTENs and forwards each notification to the
 * browser tabs of that owner over Server-Sent Events (/api/v1/realtime). Only "table X changed" is sent — clients refetch through
 * the normal API, so Row-Level Security still decides what they see.
 */
type Listener = (table: string) => void;
type State = { subs: Map<string, Set<Listener>>; started: boolean };
const g = globalThis as unknown as { __rt?: State };
const state: State = (g.__rt ??= { subs: new Map<string, Set<Listener>>(), started: false });

function dispatch(payload: string) {
  try {
    const { t, u } = JSON.parse(payload) as { t?: string; u?: string };
    if (!t || !u) return;
    state.subs.get(u)?.forEach((fn) => fn(t));
  } catch {
    /* ignore malformed payloads */
  }
}

async function listen(delay = 500): Promise<void> {
  const client = new pg.Client({ connectionString: requireEnv("DATABASE_URL"), keepAlive: true });
  const retry = () => {
    client.removeAllListeners();
    client.end().catch(() => undefined);
    setTimeout(() => void listen(Math.min(delay * 2, 15_000)), delay);
  };
  client.on("error", retry);
  client.on("end", retry);
  client.on("notification", (m) => m.payload && dispatch(m.payload));
  try {
    await client.connect();
    await client.query("listen row_changes");
  } catch {
    retry();
  }
}

/** Calls `fn(table)` whenever one of this user's rows changes, until the returned function is called. */
export function subscribe(userId: string, fn: Listener) {
  if (!state.started) {
    state.started = true;
    void listen();
  }
  let set = state.subs.get(userId);
  if (!set) state.subs.set(userId, (set = new Set()));
  set.add(fn);
  return () => {
    set.delete(fn);
    if (!set.size) state.subs.delete(userId);
  };
}
