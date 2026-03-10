import { NextRequest, NextResponse } from "next/server";

// Fallback password if env var not set (for emergency access)
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || "Arsanka01";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (password === DASHBOARD_PASSWORD) {
      const response = NextResponse.json({ success: true });
      response.cookies.set("dashboard_auth", password, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24 hours
        path: "/",
      });
      return response;
    }

    return NextResponse.json(
      { error: "Password salah" },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { error: "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
