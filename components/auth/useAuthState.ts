"use client";
import { useEffect, useLayoutEffect, useState } from "react";
import { supabaseBrowser } from "../../lib/supabase/client";
import { supabaseConfigured } from "../../lib/supabase/config";

/**
 * Whether a visitor is signed in, for marketing pages. Those pages are static, so this is worked out in the browser:
 * a cookie hint gives the right answer before the first paint, then Supabase confirms it (and follows sign-in/out).
 */
export function useAuthState(): "in" | "out" {
  const [state, setState] = useState<"in" | "out">("out");

  useLayoutEffect(() => {
    if (supabaseConfigured && /(^|;\s*)sb-[^=]*-auth-token/.test(document.cookie)) setState("in");
  }, []);

  useEffect(() => {
    if (!supabaseConfigured) return;
    const sb = supabaseBrowser();
    let live = true;
    sb.auth.getSession().then(({ data }) => { if (live) setState(data.session ? "in" : "out"); });
    const { data } = sb.auth.onAuthStateChange((_e, session) => setState(session ? "in" : "out"));
    return () => { live = false; data.subscription.unsubscribe(); };
  }, []);

  return state;
}
