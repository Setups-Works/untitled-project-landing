/** Only allow same-site relative redirects (blocks open-redirect via ?next=https://evil). */
export function safeNext(next: string | null | undefined, fallback = "/dashboard") {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
