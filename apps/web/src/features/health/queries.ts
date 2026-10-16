"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { HealthDay } from "@untitled/types";
import { api } from "../../lib/api/client";
import { qk } from "../../lib/query/keys";
import { useRealtimeInvalidate } from "../../hooks/useRealtimeInvalidate";

const COLS = "day,steps,distance_m,active_kcal,resting_hr,hr_min,hr_max,sleep_minutes,source,synced_at";
const EMPTY: HealthDay[] = [];

/**
 * The phone writes `health_daily`; this page only reads it, newest day first. A sync from the phone arrives through realtime,
 * so an open tab updates by itself. No rows means the person has not set Health up on their phone yet.
 */
export function useHealthDays(span: number) {
  const sb = useMemo(api, []);
  const q = useQuery({
    queryKey: qk.health.days(span),
    queryFn: async () => {
      const { data, error } = await sb
        .from("health_daily")
        .select<HealthDay>(COLS)
        .order("day", { ascending: false })
        .limit(span);
      if (error) throw error;
      return data as HealthDay[];
    },
  });
  useRealtimeInvalidate("health_daily", [qk.health.all]);
  return { ...q, days: q.data ?? EMPTY };
}
