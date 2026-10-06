"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** The marketing header and footer don't belong inside the signed-in app (dashboard and admin). */
export default function HideInApp({ children }: { children: ReactNode }) {
  const path = usePathname();
  if (path.startsWith("/dashboard") || path.startsWith("/admin")) return null;
  return <>{children}</>;
}
