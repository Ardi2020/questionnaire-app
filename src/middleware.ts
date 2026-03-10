import { NextRequest, NextResponse } from "next/server";

// Fallback password if env var not set (for emergency access)
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || "Arsanka01";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /dashboard routes (except /dashboard/login)
  if (pathname.startsWith("/dashboard") && pathname !== "/dashboard/login") {
    const authCookie = request.cookies.get("dashboard_auth");

    if (authCookie?.value !== DASHBOARD_PASSWORD) {
      const loginUrl = new URL("/dashboard/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
