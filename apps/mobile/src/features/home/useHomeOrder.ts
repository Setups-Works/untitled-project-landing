import AsyncStorage from "@react-native-async-storage/async-storage";
import { cleanOrder } from "@untitled/logic";
import { useCallback, useEffect, useState } from "react";

import { useAppState } from "@/providers/AppState";

/** The Home sections in their default order. */
export const HOME_SECTIONS = ["streak", "plans", "tasks", "notes", "journal", "insights"] as const;

/** The order a person dragged the Home sections into, kept on this device per account. */
export function useHomeOrder() {
  const { user } = useAppState();
  const key = user ? `home-layout:${user.id}` : null;
  const [order, setOrder] = useState<string[]>([...HOME_SECTIONS]);

  useEffect(() => {
    if (!key) return;
    let active = true;
    void AsyncStorage.getItem(key)
      .then((raw) => {
        if (active && raw) setOrder(cleanOrder(JSON.parse(raw) as unknown, HOME_SECTIONS));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [key]);

  const save = useCallback(
    (next: string[]) => {
      setOrder(next);
      if (key) void AsyncStorage.setItem(key, JSON.stringify(next)).catch(() => undefined);
    },
    [key],
  );

  return [order, save] as const;
}
