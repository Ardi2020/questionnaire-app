import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/supabase";
import { computeStrata } from "@/lib/utils";

export const dynamic = "force-dynamic";

function checkAuth(request: NextRequest): boolean {
  const cookie = request.cookies.get("dashboard_auth");
  return cookie?.value === process.env.DASHBOARD_PASSWORD;
}

// Construct definitions: name -> item codes (matching DB column names)
const CONSTRUCTS: Record<string, { label: string; items: string[] }> = {
  TI: { label: "Infrastruktur Teknologi", items: ["ti1", "ti2", "ti3", "ti4"] },
  OS: { label: "Dukungan Organisasi", items: ["os1", "os2", "os3", "os4"] },
  DC: { label: "Kapabilitas Data", items: ["dc1", "dc2", "dc3", "dc4"] },
  PEOU: { label: "Persepsi Kemudahan", items: ["peou1", "peou2", "peou3", "peou4"] },
  PU: { label: "Persepsi Kegunaan", items: ["pu1", "pu2", "pu3", "pu4"] },
  BI: { label: "Niat Perilaku", items: ["bi1", "bi2", "bi3"] },
  READ: { label: "Kesiapan Organisasi", items: ["read1", "read2", "read3", "read4", "read_g1"] },
};

const ALL_ITEMS = Object.values(CONSTRUCTS).flatMap((c) => c.items);

// Strata targets for adequacy check
const STRATA_TARGETS: Record<string, number> = {
  Publik_A: 30,
  Publik_B: 75,
  Publik_C: 75,
  Swasta_AB: 45,
  Swasta_C: 75,
};

function getStrata(jenisRS: string, kelasRS: string): string {
  const isPub = jenisRS?.includes("Publik") || jenisRS?.includes("Pemerintah");
  if (isPub && kelasRS === "Kelas A") return "Publik_A";
  if (isPub && kelasRS === "Kelas B") return "Publik_B";
  if (isPub && kelasRS === "Kelas C") return "Publik_C";
  if (!isPub && (kelasRS === "Kelas A" || kelasRS === "Kelas B")) return "Swasta_AB";
  if (!isPub && kelasRS === "Kelas C") return "Swasta_C";
  return "Unknown";
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((sum, x) => sum + (x - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

function cronbachAlpha(itemData: number[][]): number {
  // itemData: array of items, each item is array of responses
  const k = itemData.length;
  if (k < 2) return 0;
  const n = itemData[0].length;
  if (n < 2) return 0;

  // Variance of each item
  const itemVariances = itemData.map((item) => {
    const m = mean(item);
    return item.reduce((sum, x) => sum + (x - m) ** 2, 0) / (n - 1);
  });

  // Total scores per respondent
  const totalScores: number[] = [];
  for (let i = 0; i < n; i++) {
    let total = 0;
    for (let j = 0; j < k; j++) {
      total += itemData[j][i];
    }
    totalScores.push(total);
  }

  const totalVariance = (() => {
    const m = mean(totalScores);
    return totalScores.reduce((sum, x) => sum + (x - m) ** 2, 0) / (n - 1);
  })();

  if (totalVariance === 0) return 0;

  const sumItemVariances = itemVariances.reduce((a, b) => a + b, 0);
  return (k / (k - 1)) * (1 - sumItemVariances / totalVariance);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ResponseRow = Record<string, any>;

interface OutlierDetail {
  id: string;
  type: string;
  detail: string;
  nama_rs: string;
  strata: string;
  profesi: string;
  hospital_id: number | null;
}

interface HospitalListItem {
  hospital_id: number;
  nama_rs: string;
  strata: string;
  response_count: number;
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const hospitalId = searchParams.get("hospital_id");

    const sql = getDb();

    // Build WHERE clause for filtering excluded rows and optional hospital filter
    let whereClause = "WHERE (excluded = false OR excluded IS NULL)";
    const params: (string | number)[] = [];

    if (hospitalId) {
      whereClause += " AND hospital_id = " + Number(hospitalId);
    }

    // Neon serverless requires explicit template literal - column names are safe (predefined constants)
    // For filtered queries, we need to use a different approach with the neon serverless client
    let rows: ResponseRow[];
    let excludedCount = 0;

    if (hospitalId) {
      const hid = Number(hospitalId);
      rows = await sql`
        SELECT id, jenis_rs, kelas_rs, nama_rs, profesi, hospital_id,
               ti1, ti2, ti3, ti4,
               os1, os2, os3, os4,
               dc1, dc2, dc3, dc4,
               peou1, peou2, peou3, peou4,
               pu1, pu2, pu3, pu4,
               bi1, bi2, bi3,
               read1, read2, read3, read4, read_g1
        FROM responses
        WHERE (excluded = false OR excluded IS NULL) AND hospital_id = ${hid}
        ORDER BY submitted_at ASC
      ` as ResponseRow[];
    } else {
      rows = await sql`
        SELECT id, jenis_rs, kelas_rs, nama_rs, profesi, hospital_id,
               ti1, ti2, ti3, ti4,
               os1, os2, os3, os4,
               dc1, dc2, dc3, dc4,
               peou1, peou2, peou3, peou4,
               pu1, pu2, pu3, pu4,
               bi1, bi2, bi3,
               read1, read2, read3, read4, read_g1
        FROM responses
        WHERE (excluded = false OR excluded IS NULL)
        ORDER BY submitted_at ASC
      ` as ResponseRow[];
    }

    // Get excluded count
    const excludedRows = await sql`
      SELECT COUNT(*) as count FROM responses WHERE excluded = true
    ` as { count: bigint }[];
    excludedCount = Number(excludedRows[0]?.count || 0);

    // Get hospital list (only when not filtering by hospital)
    let hospitalList: HospitalListItem[] = [];
    if (!hospitalId) {
      const hospitals = await sql`
        SELECT hospital_id, nama_rs, jenis_rs, kelas_rs, COUNT(*) as response_count
        FROM responses
        WHERE (excluded = false OR excluded IS NULL) AND hospital_id IS NOT NULL
        GROUP BY hospital_id, nama_rs, jenis_rs, kelas_rs
        ORDER BY nama_rs
      ` as { hospital_id: number; nama_rs: string; jenis_rs: string; kelas_rs: string; response_count: bigint }[];

      hospitalList = hospitals.map((h) => ({
        hospital_id: h.hospital_id,
        nama_rs: h.nama_rs || "",
        strata: computeStrata(h.jenis_rs, h.kelas_rs),
        response_count: Number(h.response_count),
      }));
    }

    const n = rows.length;

    if (n === 0) {
      return NextResponse.json({
        n: 0,
        excludedCount,
        hospitalList,
        adequacy: { overall: false, message: "Belum ada data" },
        constructs: [],
        items: [],
        outliers: [],
      });
    }

    // ==========================================
    // 1. SAMPLE ADEQUACY CHECK
    // ==========================================
    const strataCounts: Record<string, number> = {};
    rows.forEach((r) => {
      const s = getStrata(r.jenis_rs, r.kelas_rs);
      strataCounts[s] = (strataCounts[s] || 0) + 1;
    });

    const strataAdequacy = Object.entries(STRATA_TARGETS).map(([strata, target]) => {
      const current = strataCounts[strata] || 0;
      const minForMGA = 30; // minimum for Multi-Group Analysis
      return {
        strata,
        current,
        target,
        minMGA: minForMGA,
        adequate: current >= target,
        mgaReady: current >= minForMGA,
      };
    });

    const overallAdequate = n >= 300;
    const allStrataAdequate = strataAdequacy.every((s) => s.adequate);
    const mgaReady = strataAdequacy.every((s) => s.mgaReady);

    // PLS-SEM rule of thumb: 10× largest number of structural paths to a construct
    // In our model: READ has max 2 paths (from BI + moderators) → need ≥ 20
    // But we target 300, so 10× rule is easily satisfied
    const tenTimesRule = n >= 90; // 9 paths × 10

    const adequacy = {
      overall: overallAdequate && allStrataAdequate,
      n,
      target: 300,
      nAdequate: overallAdequate,
      allStrataAdequate,
      mgaReady,
      tenTimesRule,
      strata: strataAdequacy,
      message: !overallAdequate
        ? `Butuh ${300 - n} responden lagi (${n}/300)`
        : !allStrataAdequate
        ? "Total tercapai tapi ada strata yang belum memenuhi target"
        : hospitalId
        ? `Filtered: ${n} responses from hospital`
        : "✓ Semua syarat sample adequacy terpenuhi",
    };

    // ==========================================
    // 2. CONSTRUCT-LEVEL STATISTICS + CRONBACH'S ALPHA
    // ==========================================
    const constructStats = Object.entries(CONSTRUCTS).map(([code, def]) => {
      // Get all item values for this construct
      const itemArrays: number[][] = def.items.map((item) =>
        rows.map((r) => Number(r[item]) || 0)
      );

      // Construct composite scores (mean of items per respondent)
      const compositeScores: number[] = [];
      for (let i = 0; i < n; i++) {
        const vals = def.items.map((item) => Number(rows[i][item]) || 0);
        compositeScores.push(mean(vals));
      }

      const m = mean(compositeScores);
      const sd = stdDev(compositeScores);
      const alpha = cronbachAlpha(itemArrays);

      return {
        code,
        label: def.label,
        itemCount: def.items.length,
        mean: Math.round(m * 100) / 100,
        stdDev: Math.round(sd * 100) / 100,
        min: Math.round(Math.min(...compositeScores) * 100) / 100,
        max: Math.round(Math.max(...compositeScores) * 100) / 100,
        cronbachAlpha: Math.round(alpha * 1000) / 1000,
        alphaAdequate: alpha >= 0.7,
        interpretation:
          alpha >= 0.9 ? "Excellent" :
          alpha >= 0.8 ? "Good" :
          alpha >= 0.7 ? "Acceptable" :
          alpha >= 0.6 ? "Questionable" :
          alpha >= 0.5 ? "Poor" : "Unacceptable",
      };
    });

    // ==========================================
    // 3. ITEM-LEVEL STATISTICS + DISTRIBUTION
    // ==========================================
    const itemStats = ALL_ITEMS.map((item) => {
      const values = rows.map((r) => Number(r[item]) || 0).filter((v) => v >= 1 && v <= 7);
      const m = mean(values);
      const sd = stdDev(values);

      // Frequency distribution (1-7)
      const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
      values.forEach((v) => {
        distribution[v] = (distribution[v] || 0) + 1;
      });

      // Check for low variance (all same answer)
      const lowVariance = sd < 0.5;

      return {
        code: item.toUpperCase(),
        dbColumn: item,
        n: values.length,
        missing: n - values.length,
        mean: Math.round(m * 100) / 100,
        stdDev: Math.round(sd * 100) / 100,
        distribution,
        lowVariance,
      };
    });

    // ==========================================
    // 4. MISSING DATA & OUTLIER DETECTION
    // ==========================================
    // Missing: items with value 0 or null
    const missingByItem: Record<string, number> = {};
    ALL_ITEMS.forEach((item) => {
      const missingCount = rows.filter(
        (r) => !r[item] || Number(r[item]) < 1 || Number(r[item]) > 7
      ).length;
      if (missingCount > 0) {
        missingByItem[item.toUpperCase()] = missingCount;
      }
    });

    // Outliers: respondents with extreme patterns - enriched with RS info
    const outliers: OutlierDetail[] = [];

    rows.forEach((r) => {
      const allValues = ALL_ITEMS.map((item) => Number(r[item]) || 0);
      const validValues = allValues.filter((v) => v >= 1 && v <= 7);

      if (validValues.length === 0) return;

      const strata = computeStrata(r.jenis_rs, r.kelas_rs);

      // Check straightlining (all same answer)
      const uniqueValues = new Set(validValues);
      if (uniqueValues.size === 1) {
        outliers.push({
          id: r.id,
          type: "straightlining",
          detail: `Semua jawaban = ${validValues[0]}`,
          nama_rs: r.nama_rs || "RS tidak diketahui",
          strata,
          profesi: r.profesi || "-",
          hospital_id: r.hospital_id,
        });
        return;
      }

      // Check near-straightlining (95% same answer)
      const freq: Record<number, number> = {};
      validValues.forEach((v) => {
        freq[v] = (freq[v] || 0) + 1;
      });
      const maxFreq = Math.max(...Object.values(freq));
      if (maxFreq / validValues.length > 0.95) {
        const dominantVal = Object.entries(freq).find(
          ([, count]) => count === maxFreq
        )?.[0];
        outliers.push({
          id: r.id,
          type: "near-straightlining",
          detail: `${Math.round((maxFreq / validValues.length) * 100)}% jawaban = ${dominantVal}`,
          nama_rs: r.nama_rs || "RS tidak diketahui",
          strata,
          profesi: r.profesi || "-",
          hospital_id: r.hospital_id,
        });
        return;
      }

      // Check total score outlier (>3 SD from mean)
      const totalScore = validValues.reduce((a, b) => a + b, 0);
      const allTotals = rows.map((row) =>
        ALL_ITEMS.map((item) => Number(row[item]) || 0)
          .filter((v) => v >= 1 && v <= 7)
          .reduce((a, b) => a + b, 0)
      );
      const totalMean = mean(allTotals);
      const totalSD = stdDev(allTotals);
      if (totalSD > 0 && Math.abs(totalScore - totalMean) > 3 * totalSD) {
        outliers.push({
          id: r.id,
          type: "extreme-score",
          detail: `Total skor = ${totalScore} (mean=${Math.round(totalMean)}, 3σ=${Math.round(totalMean + 3 * totalSD)})`,
          nama_rs: r.nama_rs || "RS tidak diketahui",
          strata,
          profesi: r.profesi || "-",
          hospital_id: r.hospital_id,
        });
      }
    });

    return NextResponse.json({
      n,
      excludedCount,
      hospitalList: hospitalId ? [] : hospitalList,
      adequacy,
      constructs: constructStats,
      items: itemStats,
      missingData: {
        totalMissing: Object.values(missingByItem).reduce((a, b) => a + b, 0),
        byItem: missingByItem,
      },
      outliers: {
        count: outliers.length,
        // 2-decimal precision so a real ~3% rate isn't displayed as a flat "3%"
        percentage: n > 0 ? Math.round((outliers.length / n) * 10000) / 100 : 0,
        byType: {
          straightlining: outliers.filter((o) => o.type === "straightlining").length,
          nearStraightlining: outliers.filter((o) => o.type === "near-straightlining").length,
          extremeScore: outliers.filter((o) => o.type === "extreme-score").length,
        },
        details: outliers,
      },
    });
  } catch (err) {
    console.error("Analytics error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
