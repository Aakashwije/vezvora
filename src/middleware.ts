import { NextResponse, type NextRequest } from "next/server";

const ADMIN_COOKIE = "vz_admin";

/**
 * Optimistic UX redirect only: sends requests with no session cookie to the
 * login page. Cookie *presence* is not treated as proof of authentication — the
 * real access check is `getSession()` (signature + expiry verification) in the
 * admin layout and server actions. This is intentionally lightweight so it runs
 * at the edge without the signing secret.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasCookie = Boolean(request.cookies.get(ADMIN_COOKIE)?.value);
  const isLogin = pathname === "/admin/login";

  if (!hasCookie && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
