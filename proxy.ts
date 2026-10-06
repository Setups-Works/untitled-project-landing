import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_KEY, SUPABASE_URL, supabaseConfigured } from "./lib/supabase/config";

export async function proxy(request: NextRequest) {
  const url = SUPABASE_URL;
  const key = SUPABASE_KEY;
  // Without valid Supabase keys there is no session to manage — let the pages show their setup notice.
  if (!supabaseConfigured || !url || !key) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // /admin: signed-out visitors go to log in; the admin layout itself checks the admin role.
  if (!data.user && (path.startsWith("/dashboard") || path.startsWith("/admin"))) {
    const to = request.nextUrl.clone();
    to.pathname = "/login";
    to.search = `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(to);
  }
  if (data.user && (path === "/login" || path === "/signup" || path === "/forgot-password")) {
    const to = request.nextUrl.clone();
    to.pathname = "/dashboard";
    to.search = "";
    return NextResponse.redirect(to);
  }
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/signup", "/forgot-password", "/reset-password", "/auth/:path*"],
};
