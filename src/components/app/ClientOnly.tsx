"use client";
import { useEffect, useState, type ReactNode } from "react";

/**
 * Renders children only in the browser. Pages that show dates, times or the greeting depend on the
 * visitor's locale and timezone, which the server can't know, so rendering them on the server would mismatch.
 */
export default function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return <>{mounted ? children : fallback}</>;
}
