"use client";
import { useLayoutEffect, useState } from "react";
import { authClient } from "../../lib/auth/client";

/**
 * Whether a visitor is signed in, for marketing pages. Those pages are static, so this is worked out in the browser:
 * a cookie hint gives the right answer before the first paint, then the auth client confirms it (and follows sign-in/out).
 */
export function useAuthState(): "in" | "out" {
  const [hint, setHint] = useState<"in" | "out">("out");
  const { data: session, isPending } = authClient.useSession();

  useLayoutEffect(() => {
    if (/(^|;\s*)(__Secure-)?better-auth\.session_token=/.test(document.cookie)) setHint("in");
  }, []);

  return isPending ? hint : session ? "in" : "out";
}
