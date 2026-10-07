// Trim stray spaces/newlines that often come along when pasting a value into a hosting dashboard.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

// The key is sent as an HTTP header, which can only hold plain ASCII. A pasted "…", smart quote or space breaks every request
// ("String contains non ISO-8859-1 code point"), so such a value is treated as not configured and explained instead.
const URL_OK = /^https?:\/\/[A-Za-z0-9.:_-]+$/;
const KEY_OK = /^[A-Za-z0-9._-]+$/;

export const supabaseProblem: string | null =
  !SUPABASE_URL || !SUPABASE_KEY ? null :
  !URL_OK.test(SUPABASE_URL.replace(/\/+$/, "")) ? "NEXT_PUBLIC_SUPABASE_URL isn’t a valid address (it should look like https://your-project.supabase.co)." :
  !KEY_OK.test(SUPABASE_KEY) ? "NEXT_PUBLIC_SUPABASE_ANON_KEY contains characters that aren’t allowed — for example “…”, quotes or spaces. Copy the full key again from Supabase → Project Settings → API." :
  null;

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY) && !supabaseProblem;

/** Only allow same-site relative redirects (blocks open-redirect via ?next=https://evil). */
export function safeNext(next: string | null | undefined, fallback = "/dashboard") {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
