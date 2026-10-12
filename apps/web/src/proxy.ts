import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Cheap redirects based on whether a session cookie exists. This is only a convenience: every page and API route still verifies the
 * session against the database (currentUser()), and /admin additionally checks the admin role.
 */
export function proxy(request: NextRequest) {
  const signedIn = Boolean(getSessionCookie(request));
  const path = request.nextUrl.pathname;

  if (!signedIn && (path.startsWith("/dashboard") || path.startsWith("/admin"))) {
    const to = request.nextUrl.clone();
    to.pathname = "/login";
    to.search = `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(to);
  }
  if (signedIn && (path === "/login" || path === "/signup" || path === "/forgot-password")) {
    const to = request.nextUrl.clone();
    to.pathname = "/dashboard";
    to.search = "";
    return NextResponse.redirect(to);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/signup", "/forgot-password", "/reset-password"],
};
