import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HEALTH_SPAN, HEALTH_WEEK } from "@untitled/logic";
import type { HealthDay } from "@untitled/types";
import { useCallback, useEffect, useState } from "react";

import { healthSource } from "./source";
import type { DayTotals } from "./source.types";
import { api } from "@/lib/api";
import { addDays, isoDate } from "@/lib/dates";
import { qk } from "@/lib/queryKeys";
import { useAppState } from "@/providers/AppState";

/** The phone re-sends the last week on each sync: today is still filling up, and an earlier sync may have missed a late watch upload. */
const SYNC_DAYS = HEALTH_WEEK;

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

  const push = useMutation({
    mutationFn: async () => {
      if (!healthSource) return [];
      const today = isoDate();
      const days = Array.from({ length: SYNC_DAYS }, (_, i) => addDays(today, -i));
      const totals = await healthSource.readDays(days);
      setNoData(!hasAnyData(totals));
      if (hasAnyData(totals)) await api.put("/api/v1/health", { source: healthSource.id, days: totals });
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
      if (connected) await sync().catch(() => undefined);
    })();
    return () => {
      live = false;
    };
  }, [flagKey, sync]);

  const connect = useCallback(async () => {
    if (!healthSource) return;
    const done = await healthSource.requestAccess().catch(() => false);
    if (!done) return;
    await AsyncStorage.setItem(flagKey, "1").catch(() => undefined);
    setStatus("ready");
    await sync().catch(() => undefined);
  }, [flagKey, sync]);

  return { status, noData, connect, sync, syncing: push.isPending, syncError: push.error };
}
