import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /dashboard routes (except /dashboard/login)
  if (pathname.startsWith("/dashboard") && pathname !== "/dashboard/login") {
    const authCookie = request.cookies.get("dashboard_auth");

    if (authCookie?.value !== process.env.DASHBOARD_PASSWORD) {
      const loginUrl = new URL("/dashboard/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
