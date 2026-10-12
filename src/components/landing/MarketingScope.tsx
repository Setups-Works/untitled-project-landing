"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Wraps every page and decides which colour theme it gets:
 *   - the signed-in app (/dashboard, /admin): the product's own forest green, untouched;
 *   - the home page (/): the original multi-colour tints (violet, blue, amber, green…);
 *   - every other marketing page: the rose-pink theme (`data-accent="pink"`, defined in globals.css under "MARKETING THEME").
 * The theme is an attribute on this wrapper rather than on <html>, so it is part of the server render (no flash of the wrong colour)
 * and can never leak into the app. `overflow-x-clip` (not `hidden`) stops animated elements that start off to the side from widening
 * the page on a phone, and keeps sticky positioning working.
 */
export default function MarketingScope({ children }: { children: ReactNode }) {
  const path = usePathname();
  const inApp = path.startsWith("/dashboard") || path.startsWith("/admin");
  const pink = !inApp && path !== "/";
  return (
    <div data-accent={pink ? "pink" : undefined} className="overflow-x-clip">
      {children}
    </div>
  );
}
