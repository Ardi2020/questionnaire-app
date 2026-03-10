import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function checkAuth(request: NextRequest): boolean {
  const cookie = request.cookies.get("dashboard_auth");
  return cookie?.value === process.env.DASHBOARD_PASSWORD;
}

export async function DELETE(request: NextRequest) {
  if (!checkAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const sql = getDb();
    const result = await sql`DELETE FROM responses`;
    return NextResponse.json({ success: true, deleted: result.length, message: `Data berhasil dihapus` });
  } catch (err) {
    console.error("Reset error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
