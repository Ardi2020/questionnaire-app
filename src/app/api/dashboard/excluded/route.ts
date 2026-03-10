import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/supabase";
import { computeStrata } from "@/lib/utils";

export const dynamic = "force-dynamic";

function checkAuth(request: NextRequest): boolean {
  const cookie = request.cookies.get("dashboard_auth");
  return cookie?.value === process.env.DASHBOARD_PASSWORD;
}

const ALL_ITEMS = [
  "ti1", "ti2", "ti3", "ti4",
  "os1", "os2", "os3", "os4",
  "dc1", "dc2", "dc3", "dc4",
  "peou1", "peou2", "peou3", "peou4",
  "pu1", "pu2", "pu3", "pu4",
  "bi1", "bi2", "bi3",
  "read1", "read2", "read3", "read4", "read_g1",
];

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// GET - List all excluded responses
export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sql = getDb();

    const rows = await sql`
      SELECT id, nama_rs, jenis_rs, kelas_rs, profesi,
             excluded_reason, excluded_at,
             ti1, ti2, ti3, ti4,
             os1, os2, os3, os4,
             dc1, dc2, dc3, dc4,
             peou1, peou2, peou3, peou4,
             pu1, pu2, pu3, pu4,
             bi1, bi2, bi3,
             read1, read2, read3, read4, read_g1
      FROM responses
      WHERE excluded = true
      ORDER BY excluded_at DESC
    `;

    const excluded = rows.map((r: Record<string, unknown>) => {
      // Calculate mean score across all 28 items
      const values = ALL_ITEMS.map((item) => Number(r[item]) || 0).filter((v) => v >= 1 && v <= 7);
      const meanScore = values.length > 0 ? mean(values) : 0;

      return {
        id: r.id as string,
        nama_rs: (r.nama_rs as string) || "-",
        strata: computeStrata(r.jenis_rs as string | null, r.kelas_rs as string | null),
        profesi: (r.profesi as string) || "-",
        excluded_reason: (r.excluded_reason as string) || "-",
        excluded_at: r.excluded_at as string,
        mean_score: Math.round(meanScore * 100) / 100,
      };
    });

    return NextResponse.json({ excluded });
  } catch (err) {
    console.error("Excluded list error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
