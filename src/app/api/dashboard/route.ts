import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/supabase";
import { getWilayahFromProvinsi } from "@/lib/hospitals";

export const dynamic = "force-dynamic";

function checkAuth(request: NextRequest): boolean {
  const cookie = request.cookies.get("dashboard_auth");
  return (
    cookie?.value === (process.env.DASHBOARD_PASSWORD || "Arsanka01")
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function getStrata(jenisRS: string, kelasRS: string): string {
  const isPub = jenisRS?.includes("Publik") || jenisRS?.includes("Pemerintah");
  if (isPub && kelasRS === "Kelas A") return "Publik_A";
  if (isPub && kelasRS === "Kelas B") return "Publik_B";
  if (isPub && kelasRS === "Kelas C") return "Publik_C";
  if (!isPub && (kelasRS === "Kelas A" || kelasRS === "Kelas B")) return "Swasta_AB";
  if (!isPub && kelasRS === "Kelas C") return "Swasta_C";
  return "Unknown";
}

function getStrataFromDB(kepemilikan: string, kelas: string): string {
  const isPub = kepemilikan === "Publik";
  if (isPub && kelas === "A") return "Publik_A";
  if (isPub && kelas === "B") return "Publik_B";
  if (isPub && kelas === "C") return "Publik_C";
  if (!isPub && (kelas === "A" || kelas === "B")) return "Swasta_AB";
  if (!isPub && kelas === "C") return "Swasta_C";
  return "Unknown";
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const sql = getDb();

    // Fetch active hospitals from DB (supports 200+)
    const activeHospitals: Row[] = await sql`
      SELECT id, no_urut, nama_rs, kelas_rs, kepemilikan, strata, provinsi, kota_kabupaten
      FROM hospitals
      WHERE is_active = true
      ORDER BY no_urut ASC
    `;

    const allResponses: Row[] = await sql`
      SELECT id, submitted_at, jenis_rs, kelas_rs, provinsi, hospital_id, nama_rs, profesi, wilayah
      FROM responses
      WHERE (excluded = false OR excluded IS NULL)
      ORDER BY submitted_at DESC
    `;

    const total = allResponses.length;
    const lastSubmission = total > 0 ? allResponses[0].submitted_at : null;

    const strataTargets = [
      { strata: "Publik_A",  label: "RS Publik Kelas A",     target: 30 },
      { strata: "Publik_B",  label: "RS Publik Kelas B",     target: 75 },
      { strata: "Publik_C",  label: "RS Publik Kelas C",     target: 75 },
      { strata: "Swasta_AB", label: "RS Swasta Kelas A & B", target: 45 },
      { strata: "Swasta_C",  label: "RS Swasta Kelas C",     target: 75 },
    ];

    const strataCounts: Record<string, number> = {};
    allResponses.forEach((r) => {
      const s = getStrata(r.jenis_rs, r.kelas_rs);
      strataCounts[s] = (strataCounts[s] || 0) + 1;
    });
    const strataQuota = strataTargets.map((st) => ({
      ...st,
      current: strataCounts[st.strata] || 0,
      percentage: Math.round(((strataCounts[st.strata] || 0) / st.target) * 100),
    }));

    // Province stats — dynamic from all active hospitals
    const provTargetRS: Record<string, number> = {};
    activeHospitals.forEach((h) => {
      provTargetRS[h.provinsi] = (provTargetRS[h.provinsi] || 0) + 1;
    });
    const provCounts: Record<string, number> = {};
    allResponses.forEach((r) => {
      if (r.provinsi) provCounts[r.provinsi] = (provCounts[r.provinsi] || 0) + 1;
    });

    const provinsiOrder = [
      "Sumatera Barat","DKI Jakarta","Jawa Barat","Jawa Tengah","DI Yogyakarta","Jawa Timur","Banten",
      "Sumatera Utara","Sumatera Selatan","Riau","Jawa Timur","Bali","Sulawesi Selatan","Kalimantan Timur","Kalimantan Selatan",
    ];
    // Build provinsi stats from all active hospitals provinces
    const allProvinces = [...new Set(activeHospitals.map((h) => h.provinsi))].sort();
    const provinsiStats = allProvinces.map((p) => {
      const targetRS = provTargetRS[p] || 0;
      const targetResp = targetRS * 3;
      const current = provCounts[p] || 0;
      return {
        provinsi: p,
        current,
        targetRS,
        targetResp,
        percentage: targetResp > 0 ? Math.round((current / targetResp) * 100) : 0,
      };
    }).sort((a, b) => b.current - a.current);
    const otherCount = allResponses.filter(
      (r) => r.provinsi && !allProvinces.includes(r.provinsi)
    ).length;
    if (otherCount > 0)
      provinsiStats.push({ provinsi: "Lainnya", current: otherCount, targetRS: 0, targetResp: 0, percentage: 0 });

    const profesiCounts: Record<string, number> = {};
    allResponses.forEach((r) => {
      if (r.profesi) profesiCounts[r.profesi] = (profesiCounts[r.profesi] || 0) + 1;
    });
    const profesiStats = Object.entries(profesiCounts).map(([p, count]) => ({
      profesi: p,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));

    // Hospital stats — from DB, supports all 200 hospitals
    const hospitalCounts: Record<number, number> = {};
    allResponses.forEach((r) => {
      if (r.hospital_id) hospitalCounts[r.hospital_id] = (hospitalCounts[r.hospital_id] || 0) + 1;
    });
    const hospitalStats = activeHospitals.map((h) => {
      const current = hospitalCounts[h.id] || 0;
      const target = 3;
      let status: "complete" | "partial" | "empty" = "empty";
      if (current >= target) status = "complete";
      else if (current > 0) status = "partial";
      return {
        id: h.id,
        nama: h.nama_rs,
        strata: getStrataFromDB(h.kepemilikan, h.kelas_rs),
        provinsi: h.provinsi,
        kotaKab: h.kota_kabupaten,
        kepemilikan: h.kepemilikan,
        kelasRS: h.kelas_rs,
        wilayah: getWilayahFromProvinsi(h.provinsi),
        current,
        target,
        status,
      };
    });

    const nonTargetMap: Record<string, { nama: string; provinsi: string; count: number }> = {};
    allResponses.forEach((r) => {
      if (!r.hospital_id && r.nama_rs) {
        const key = r.nama_rs.trim().toLowerCase();
        if (!nonTargetMap[key])
          nonTargetMap[key] = { nama: r.nama_rs.trim(), provinsi: r.provinsi || "Tidak diketahui", count: 0 };
        nonTargetMap[key].count += 1;
      }
    });

    return NextResponse.json({
      totalResponses: total,
      target: 300,
      lastSubmission,
      strataQuota,
      provinsiStats,
      profesiStats,
      hospitalStats,
      nonTargetRS: Object.values(nonTargetMap).sort((a, b) => b.count - a.count),
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
