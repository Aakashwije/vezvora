import { NextResponse, type NextRequest } from "next/server";

const ADMIN_COOKIE = "vz_admin";

/**
 * Gate every /admin route behind a session cookie. Unauthenticated requests
 * are redirected to the login page; an already-authenticated user hitting the
 * login page is bounced to the dashboard.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authed = Boolean(request.cookies.get(ADMIN_COOKIE)?.value);
  const isLogin = pathname === "/admin/login";

  if (!authed && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  if (authed && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
