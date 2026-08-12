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
    const anonymous = searchParams.get("anonymous") === "true";

    const sql = getDb();

    // LEFT JOIN hospitals so each row also carries the hospital's official
    // "No. Urut" (1-163, matches the target-hospital reference list) instead
    // of only the internal DB primary key (which can be any number due to
    // the SERIAL sequence — deactivated/re-added hospitals leave gaps).
    // LEFT JOIN keeps rows whose hospital_id is NULL or points at a hospital
    // outside the current active list (no_urut_rs comes back empty for those).
    let responses;
    if (includeExcluded) {
      responses = await sql`
        SELECT r.*, h.no_urut AS no_urut_rs
        FROM responses r
        LEFT JOIN hospitals h ON h.id = r.hospital_id
        ORDER BY r.submitted_at ASC
      `;
    } else {
      responses = await sql`
        SELECT r.*, h.no_urut AS no_urut_rs
        FROM responses r
        LEFT JOIN hospitals h ON h.id = r.hospital_id
        WHERE (r.excluded = false OR r.excluded IS NULL)
        ORDER BY r.submitted_at ASC
      `;
    }

    if (!responses || responses.length === 0) {
      return new NextResponse("Belum ada data responden.", { status: 200, headers: { "Content-Type": "text/plain" } });
    }

    // Anonymous mode drops every column that can identify the specific
    // hospital a response came from — nama_rs (name), hospital_id and
    // no_urut_rs (both reversible to a name via the target-hospital list),
    // and excluded_reason (free text, kept out of external-facing exports
    // as a precaution even though current values don't name a hospital).
    // Analytical fields that don't identify the hospital (provinsi,
    // jenis_rs/kelas_rs = publik-swasta + kelas, wilayah, profesi,
    // pengalaman, and every Likert item) are all kept.
    const columns = anonymous
      ? [
          "id","submitted_at","jenis_rs","kelas_rs","provinsi",
          "wilayah","profesi","pengalaman",
          "ti1","ti2","ti3","ti4","os1","os2","os3","os4",
          "dc1","dc2","dc3","dc4","peou1","peou2","peou3","peou4",
          "pu1","pu2","pu3","pu4","bi1","bi2","bi3",
          "read1","read2","read3","read4","read_g1",
          "excluded","excluded_at",
        ]
      : [
          "id","submitted_at","jenis_rs","kelas_rs","provinsi","nama_rs","hospital_id","no_urut_rs",
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

    const fnamePrefix = anonymous ? "responses_anonim" : "responses";
    return new NextResponse([header, ...rows].join("\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fnamePrefix}_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
