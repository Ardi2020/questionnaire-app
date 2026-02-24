import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

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
    const supabase = getSupabase();

    // Delete all responses (neq filter to match all rows)
    const { error, count } = await supabase
      .from("responses")
      .delete({ count: "exact" })
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) {
      console.error("Reset error:", error);
      return NextResponse.json(
        { error: "Gagal menghapus data", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deleted: count,
      message: `${count} respons berhasil dihapus`,
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
