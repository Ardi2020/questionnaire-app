import { NextResponse } from "next/server";
import { getDb } from "@/lib/supabase";

export const dynamic = "force-dynamic";

interface HospitalFromDB {
  id: number;
  no_urut: number;
  nama_rs: string;
  kelas_rs: string;
  kelas_terkini: string | null;
  kepemilikan: string;
  strata: string;
  target_mga: number | null;
  provinsi: string;
  kota_kabupaten: string;
  is_active: boolean | null;
}

export async function GET() {
  try {
    const sql = getDb();

    // Try to fetch from hospitals table
    const hospitals = await sql`
      SELECT
        id,
        no_urut,
        nama_rs,
        kelas_rs,
        kelas_terkini,
        kepemilikan,
        strata,
        target_mga,
        provinsi,
        kota_kabupaten,
        is_active
      FROM hospitals
      WHERE is_active = true OR is_active IS NULL
      ORDER BY no_urut ASC
    ` as HospitalFromDB[];

    return NextResponse.json({
      success: true,
      data: hospitals
    });
  } catch (error) {
    console.error("Error fetching hospitals:", error);

    // If table doesn't exist, return empty array (fallback to hardcoded in frontend)
    return NextResponse.json({
      success: false,
      error: "Hospitals table not found or query failed",
      data: []
    }, { status: 500 });
  }
}
