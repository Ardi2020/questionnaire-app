import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { HOSPITALS } from "@/lib/hospitals";

export const dynamic = "force-dynamic";

function checkAuth(request: NextRequest): boolean {
  const cookie = request.cookies.get("dashboard_auth");
  return cookie?.value === process.env.DASHBOARD_PASSWORD;
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabase();

    // Fetch all responses
    const { data: responses, error } = await supabase
      .from("responses")
      .select(
        "id, submitted_at, jenis_rs, kelas_rs, provinsi, hospital_id, nama_rs, profesi, wilayah"
      )
      .order("submitted_at", { ascending: false });

    if (error) {
      console.error("Dashboard query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch data" },
        { status: 500 }
      );
    }

    const allResponses = responses || [];
    const total = allResponses.length;
    const lastSubmission =
      total > 0 ? allResponses[0].submitted_at : null;

    // Strata quota
    const strataTargets = [
      { strata: "Publik_A", label: "RS Publik Kelas A", target: 30 },
      { strata: "Publik_B", label: "RS Publik Kelas B", target: 75 },
      { strata: "Publik_C", label: "RS Publik Kelas C", target: 75 },
      { strata: "Swasta_AB", label: "RS Swasta Kelas A & B", target: 45 },
      { strata: "Swasta_C", label: "RS Swasta Kelas C", target: 75 },
    ];

    function getStrata(jenisRS: string, kelasRS: string): string {
      const isPub = jenisRS?.includes("Publik") || jenisRS?.includes("Pemerintah");
      if (isPub && kelasRS === "Kelas A") return "Publik_A";
      if (isPub && kelasRS === "Kelas B") return "Publik_B";
      if (isPub && kelasRS === "Kelas C") return "Publik_C";
      if (!isPub && (kelasRS === "Kelas A" || kelasRS === "Kelas B"))
        return "Swasta_AB";
      if (!isPub && kelasRS === "Kelas C") return "Swasta_C";
      return "Unknown";
    }

    const strataCounts: Record<string, number> = {};
    allResponses.forEach((r) => {
      const s = getStrata(r.jenis_rs, r.kelas_rs);
      strataCounts[s] = (strataCounts[s] || 0) + 1;
    });

    const strataQuota = strataTargets.map((st) => ({
      ...st,
      current: strataCounts[st.strata] || 0,
      percentage: Math.round(
        ((strataCounts[st.strata] || 0) / st.target) * 100
      ),
    }));

    // Province stats
    const provTargetRS: Record<string, number> = {};
    HOSPITALS.forEach((h) => {
      provTargetRS[h.provinsi] = (provTargetRS[h.provinsi] || 0) + 1;
    });

    const provCounts: Record<string, number> = {};
    allResponses.forEach((r) => {
      if (r.provinsi) {
        provCounts[r.provinsi] = (provCounts[r.provinsi] || 0) + 1;
      }
    });

    const provinsiOrder = [
      "Sumatera Barat",
      "DKI Jakarta",
      "Jawa Barat",
      "Jawa Tengah",
      "DI Yogyakarta",
      "Jawa Timur",
      "Banten",
    ];

    const provinsiStats = provinsiOrder.map((p) => {
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
    });

    // Add "Lainnya" if any responses from other provinces
    const otherCount = allResponses.filter(
      (r) => r.provinsi && !provinsiOrder.includes(r.provinsi)
    ).length;
    if (otherCount > 0) {
      provinsiStats.push({
        provinsi: "Lainnya",
        current: otherCount,
        targetRS: 0,
        targetResp: 0,
        percentage: 0,
      });
    }

    // Profesi stats
    const profesiCounts: Record<string, number> = {};
    allResponses.forEach((r) => {
      if (r.profesi) {
        profesiCounts[r.profesi] = (profesiCounts[r.profesi] || 0) + 1;
      }
    });

    const profesiStats = Object.entries(profesiCounts).map(([p, count]) => ({
      profesi: p,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));

    // Hospital stats
    const hospitalCounts: Record<number, number> = {};
    allResponses.forEach((r) => {
      if (r.hospital_id) {
        hospitalCounts[r.hospital_id] =
          (hospitalCounts[r.hospital_id] || 0) + 1;
      }
    });

    const hospitalStats = HOSPITALS.map((h) => {
      const current = hospitalCounts[h.id] || 0;
      const target = 3;
      let status: "complete" | "partial" | "empty" = "empty";
      if (current >= target) status = "complete";
      else if (current > 0) status = "partial";
      return {
        id: h.id,
        nama: h.nama,
        strata: h.strata,
        provinsi: h.provinsi,
        kotaKab: h.kotaKab,
        current,
        target,
        status,
      };
    });

    // Non-target RS (hospital_id is null but nama_rs exists)
    const nonTargetMap: Record<string, { nama: string; provinsi: string; count: number }> = {};
    allResponses.forEach((r) => {
      if (!r.hospital_id && r.nama_rs) {
        const key = r.nama_rs.trim().toLowerCase();
        if (!nonTargetMap[key]) {
          nonTargetMap[key] = {
            nama: r.nama_rs.trim(),
            provinsi: r.provinsi || "Tidak diketahui",
            count: 0,
          };
        }
        nonTargetMap[key].count += 1;
      }
    });
    const nonTargetRS = Object.values(nonTargetMap).sort((a, b) => b.count - a.count);

    return NextResponse.json({
      totalResponses: total,
      target: 300,
      lastSubmission,
      strataQuota,
      provinsiStats,
      profesiStats,
      hospitalStats,
      nonTargetRS,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
