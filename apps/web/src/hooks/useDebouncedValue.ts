"use client";
import { useEffect, useState } from "react";

/** `value`, but only after it has stopped changing for `ms` (so typing in a search box does not query on every key). */
export function useDebouncedValue<T>(value: T, ms: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return settled;
}
