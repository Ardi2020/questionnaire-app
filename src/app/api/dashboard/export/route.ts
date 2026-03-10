import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function checkAuth(request: NextRequest): boolean {
  const cookie = request.cookies.get("dashboard_auth");
  return cookie?.value === process.env.DASHBOARD_PASSWORD;
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const includeExcluded = searchParams.get("include_excluded") === "true";

    const sql = getDb();

    let responses;
    if (includeExcluded) {
      // Export ALL rows including excluded
      responses = await sql`SELECT * FROM responses ORDER BY submitted_at ASC`;
    } else {
      // Export only non-excluded rows
      responses = await sql`
        SELECT * FROM responses
        WHERE (excluded = false OR excluded IS NULL)
        ORDER BY submitted_at ASC
      `;
    }

    if (!responses || responses.length === 0) {
      return new NextResponse("Belum ada data responden.", { status: 200, headers: { "Content-Type": "text/plain" } });
    }

    const columns = [
      "id","submitted_at","jenis_rs","kelas_rs","provinsi","nama_rs","hospital_id",
      "wilayah","profesi","pengalaman",
      "ti1","ti2","ti3","ti4","os1","os2","os3","os4",
      "dc1","dc2","dc3","dc4","peou1","peou2","peou3","peou4",
      "pu1","pu2","pu3","pu4","bi1","bi2","bi3",
      "read1","read2","read3","read4","read_g1",
      "excluded","excluded_reason","excluded_at",
    ];

    const header = columns.join(",");
    const rows = responses.map((r) =>
      columns.map((col) => {
        const val = r[col];
        if (val === null || val === undefined) return "";
        const str = String(val);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) return `"${str.replace(/"/g, '""')}"`;
        return str;
      }).join(",")
    );

    return new NextResponse([header, ...rows].join("\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="responses_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
