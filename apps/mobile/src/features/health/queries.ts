import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HEALTH_SPAN, HEALTH_WEEK } from "@untitled/logic";
import type { HealthDay } from "@untitled/types";
import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";

import { sanitizeDay } from "./limits";
import { healthSource } from "./source";
import type { DayTotals } from "./source.types";
import { api } from "@/lib/api";
import { addDays, isoDate } from "@/lib/dates";
import { qk } from "@/lib/queryKeys";
import { useAppState } from "@/providers/AppState";

/** The phone re-sends the last week on each sync: today is still filling up, and an earlier sync may have missed a late watch upload. */
const SYNC_DAYS = HEALTH_WEEK;
/** Automatic syncs (opening the app, coming back to it) are skipped within this time of the last one; pulling down always syncs. */
const AUTO_SYNC_GAP_MS = 2 * 60_000;

type SyncOptions = { force?: boolean } | undefined;
type LastSync = { at: number; sig: string };

export function useHealthDays() {
  return useQuery({
    queryKey: [...qk.health, HEALTH_SPAN],
    queryFn: async () => (await api.get<{ data: HealthDay[] }>(`/api/v1/health?days=${HEALTH_SPAN}`)).data,
  });
}

const hasAnyData = (days: DayTotals[]) =>
  days.some((d) => Object.entries(d).some(([k, v]) => k !== "day" && v !== null));

export type HealthStatus = "checking" | "unsupported" | "setup" | "ready";

/**
 * Connects the phone's health service to the account. "Setup" means the person has not allowed access yet; "ready" means they did
 * and their daily totals are being sent to the server (where the web Health page and chat read them). The system never says which
 * read types were allowed, so `noData` — a sync that found nothing at all — is how we notice a denied permission.
 */
export function useHealthConnection() {
  const { user } = useAppState();
  const qc = useQueryClient();
  const flagKey = `health:connected:${user?.id ?? "anon"}`;
  const [status, setStatus] = useState<HealthStatus>("checking");
  const [noData, setNoData] = useState(false);
  /** What the phone read on the last sync, kept so the screen can show it even if saving to the account fails. */
  const [phoneDays, setPhoneDays] = useState<HealthDay[]>([]);

  const lastKey = `health:last:${user?.id ?? "anon"}`;

  const push = useMutation({
    mutationFn: async (opts: SyncOptions) => {
      if (!healthSource) return [];
      const force = opts?.force === true;
      const last = JSON.parse((await AsyncStorage.getItem(lastKey).catch(() => null)) ?? "null") as LastSync | null;
      // An automatic sync right after another one has nothing new to read.
      if (!force && last && Date.now() - last.at < AUTO_SYNC_GAP_MS) return [];

      const today = isoDate();
      const days = Array.from({ length: SYNC_DAYS }, (_, i) => addDays(today, -i));
      const source = healthSource.id;
      const totals = (await healthSource.readDays(days)).map(sanitizeDay);
      setNoData(!hasAnyData(totals));
      const readAt = new Date().toISOString();
      setPhoneDays(totals.map((t) => ({ ...t, source, synced_at: readAt })));

      // Upload only when something changed since the last successful upload. Pulling down uploads regardless, which also repairs the
      // account if another phone replaced these days.
      const sig = JSON.stringify(totals);
      if (hasAnyData(totals) && (force || sig !== last?.sig)) {
        await api.put("/api/v1/health", { source, days: totals });
        await AsyncStorage.setItem(lastKey, JSON.stringify({ at: Date.now(), sig } satisfies LastSync)).catch(() => undefined);
      } else if (last) {
        await AsyncStorage.setItem(lastKey, JSON.stringify({ at: Date.now(), sig: last.sig } satisfies LastSync)).catch(() => undefined);
      }
      return totals;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.health }),
  });
  const { mutateAsync: sync } = push;

  useEffect(() => {
    let live = true;
    void (async () => {
      if (!healthSource || !(await healthSource.isAvailable().catch(() => false))) return live && setStatus("unsupported");
      const connected = (await AsyncStorage.getItem(flagKey).catch(() => null)) === "1";
      if (!live) return;
      setStatus(connected ? "ready" : "setup");
      if (connected) await sync({ force: false }).catch(() => undefined);
    })();
    return () => {
      live = false;
    };
  }, [flagKey, sync]);

  // Coming back to the app is when today's steps have moved on, so catch up then (the gap above stops it repeating).
  useEffect(() => {
    if (status !== "ready") return;
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") void sync({ force: false }).catch(() => undefined);
    });
    return () => sub.remove();
  }, [status, sync]);

  const connect = useCallback(async () => {
    if (!healthSource) return;
    const done = await healthSource.requestAccess().catch(() => false);
    if (!done) return;
    await AsyncStorage.setItem(flagKey, "1").catch(() => undefined);
    setStatus("ready");
    await sync({ force: true }).catch(() => undefined);
  }, [flagKey, sync]);

  /** Pull-to-refresh: a syncing phone reads and uploads; any other phone just reloads what the account has. */
  const refresh = useCallback(async () => {
    if (status === "ready") await sync({ force: true });
    else await qc.invalidateQueries({ queryKey: qk.health });
  }, [status, sync, qc]);

  /** Turns this phone's sync on (asks for access the first time) or off. Off keeps showing the account's data, just stops uploading. */
  const setSyncOn = useCallback(
    async (on: boolean) => {
      if (on) return connect();
      await AsyncStorage.setItem(flagKey, "0").catch(() => undefined);
      setPhoneDays([]);
      setStatus("setup");
    },
    [connect, flagKey],
  );

  return { status, noData, phoneDays, connect, refresh, setSyncOn, sync, syncing: push.isPending, syncError: push.error };
}
