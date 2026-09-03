import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Route protection for the dashboard.
 *
 * Next.js 16 renamed Middleware to Proxy; the behaviour is the same. This runs
 * before every matched request, which is exactly why it does so little: it
 * reads a cookie and redirects, and never asks the API or the database
 * anything.
 *
 * This is an *optimistic* check and not a security boundary. Someone who forges
 * a cookie value gets past it and then gets a 401 from the API, because the
 * real decision is made where the data is - in the session read on the server
 * and again in every backend endpoint. Treating this as the guard would mean
 * one framework quirk stood between an attacker and the archive.
 *
 * What it does buy is that a signed-out visitor lands on the sign-in page
 * instead of watching a dashboard shell render and then collapse into an
 * error.
 */
const ACCESS_COOKIE = "wascat_at";
const SIGN_IN = "/admin/login";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(ACCESS_COOKIE)?.value);

  if (pathname === SIGN_IN) {
    // Already signed in, so send them where they were going.
    if (hasSession) {
      return NextResponse.redirect(new URL("/admin", request.nextUrl));
    }
    return NextResponse.next();
  }

  if (!hasSession) {
    const url = new URL(SIGN_IN, request.nextUrl);
    // Remember the destination so signing in resumes the journey rather than
    // dumping everyone on the overview.
    if (pathname !== "/admin") {
      url.searchParams.set("next", `${pathname}${search}`);
    }
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Only the dashboard. The public site must stay reachable without a session,
  // and running this on every request would put a redirect check in front of
  // every prefetched catalogue page for no reason.
  matcher: ["/admin", "/admin/:path*"],
};
