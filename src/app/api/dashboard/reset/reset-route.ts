import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function checkAuth(request: NextRequest): boolean {
  const cookie = request.cookies.get("dashboard_auth");
  return cookie?.value === process.env.DASHBOARD_PASSWORD;
}

export async function DELETE(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { rowCount } = await sql`DELETE FROM responses`;

    return NextResponse.json({
      success: true,
      deleted: rowCount,
      message: `${rowCount} respons berhasil dihapus`,
    });
  } catch (err) {
    console.error("Reset error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Terjadi kesalahan server", detail: message },
      { status: 500 }
    );
  }
}
