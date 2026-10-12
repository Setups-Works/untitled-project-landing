import type { ReactNode } from "react";

/**
 * Wraps every page. `overflow-x-clip` (not `hidden`) stops animated elements that start off to the side from widening the page on a
 * phone, and keeps sticky positioning working. Every page uses the product's own colours (forest-green accent, multi-colour tints).
 */
export default function MarketingScope({ children }: { children: ReactNode }) {
  return <div className="overflow-x-clip">{children}</div>;
}
