"use client";

import { useState, useEffect, useCallback } from "react";

interface StrataAdequacy {
  strata: string;
  current: number;
  target: number;
  minMGA: number;
  adequate: boolean;
  mgaReady: boolean;
}

interface Adequacy {
  overall: boolean;
  n: number;
  target: number;
  nAdequate: boolean;
  allStrataAdequate: boolean;
  mgaReady: boolean;
  tenTimesRule: boolean;
  strata: StrataAdequacy[];
  message: string;
}

interface ConstructStat {
  code: string;
  label: string;
  itemCount: number;
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  cronbachAlpha: number;
  alphaAdequate: boolean;
  interpretation: string;
}

interface ItemStat {
  code: string;
  n: number;
  missing: number;
  mean: number;
  stdDev: number;
  distribution: Record<number, number>;
  lowVariance: boolean;
}

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

interface ExcludedResponse {
  id: string;
  nama_rs: string;
  strata: string;
  profesi: string;
  excluded_reason: string;
  excluded_at: string;
  mean_score: number;
}

interface AnalyticsData {
  n: number;
  excludedCount: number;
  hospitalList: HospitalListItem[];
  adequacy: Adequacy;
  constructs: ConstructStat[];
  items: ItemStat[];
  missingData: { totalMissing: number; byItem: Record<string, number> };
  outliers: {
    count: number;
    percentage: number;
    byType?: { straightlining: number; nearStraightlining: number; extremeScore: number };
    details: OutlierDetail[];
  };
}

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
      {ok ? "✓" : "✗"} {label}
    </span>
  );
}

function MiniBar({ value, max, color = "bg-blue-500" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full h-4 bg-gray-100 rounded overflow-hidden flex">
      <div className={`h-full ${color} rounded`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function DistributionBar({ distribution, n }: { distribution: Record<number, number>; n: number }) {
  const colors = [
    "bg-red-400", "bg-orange-400", "bg-amber-400", "bg-gray-400",
    "bg-sky-400", "bg-blue-500", "bg-emerald-500",
  ];
  return (
    <div className="flex h-5 rounded overflow-hidden w-full" title="Distribusi 1-7">
      {[1, 2, 3, 4, 5, 6, 7].map((v) => {
        const count = distribution[v] || 0;
        const pct = n > 0 ? (count / n) * 100 : 0;
        return pct > 0 ? (
          <div
            key={v}
            className={`${colors[v - 1]} flex items-center justify-center text-[9px] text-white font-bold`}
            style={{ width: `${pct}%`, minWidth: pct > 5 ? "auto" : 0 }}
            title={`${v}: ${count} (${Math.round(pct)}%)`}
          >
            {pct > 8 ? v : ""}
          </div>
        ) : null;
      })}
    </div>
  );
}

export function AnalyticsPanel() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedConstruct, setExpandedConstruct] = useState<string | null>(null);

  // Hospital filter states
  const [hospitalFilter, setHospitalFilter] = useState<number | null>(null);
  const [hospitalSearch, setHospitalSearch] = useState("");

  // Excluded responses states
  const [excludedData, setExcludedData] = useState<ExcludedResponse[]>([]);
  const [excludedLoading, setExcludedLoading] = useState(false);

  // Action states
  const [excluding, setExcluding] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      const url = hospitalFilter
        ? `/api/dashboard/analytics?hospital_id=${hospitalFilter}`
        : "/api/dashboard/analytics";
      const res = await fetch(url);
      if (res.status === 401) return;
      if (!res.ok) throw new Error("Gagal memuat analisis");
      setData(await res.json());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [hospitalFilter]);

  const fetchExcluded = useCallback(async () => {
    setExcludedLoading(true);
    try {
      const res = await fetch("/api/dashboard/excluded");
      if (res.status === 401) return;
      if (!res.ok) throw new Error("Gagal memuat daftar excluded");
      const json = await res.json();
      setExcludedData(json.excluded || []);
    } catch (err) {
      console.error("Failed to fetch excluded:", err);
    } finally {
      setExcludedLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    fetchExcluded();
  }, [fetchExcluded]);

  const handleExclude = async (id: string, reason: string) => {
    const outlier = data?.outliers.details.find(o => o.id === id);
    const rsName = outlier?.nama_rs || "Unknown";
    if (!confirm(`Exclude responden dari ${rsName}?\n\nAlasan: ${reason}\n\nData akan di-soft-delete (bisa di-restore).`)) return;

    setExcluding(id);
    try {
      const res = await fetch("/api/dashboard/exclude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, reason }),
      });
      if (!res.ok) throw new Error("Failed to exclude");

      await Promise.all([fetchAnalytics(), fetchExcluded()]);
    } catch (err) {
      alert("Gagal exclude responden. Coba lagi.");
    } finally {
      setExcluding(null);
    }
  };

  const handleRestore = async (id: string) => {
    if (!confirm("Kembalikan responden ini ke dataset aktif?")) return;

    setRestoring(id);
    try {
      const res = await fetch("/api/dashboard/exclude", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to restore");

      await Promise.all([fetchAnalytics(), fetchExcluded()]);
    } catch (err) {
      alert("Gagal restore responden. Coba lagi.");
    } finally {
      setRestoring(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-sm text-red-500 py-8 text-center">{error || "Tidak ada data"}</p>;
  }

  if (data.n === 0) {
    return <p className="text-sm text-gray-400 py-8 text-center">Belum ada data untuk dianalisis.</p>;
  }

  const { adequacy, constructs, items, missingData, outliers, hospitalList, excludedCount } = data;

  // Group items by construct
  const constructItems: Record<string, ItemStat[]> = {};
  constructs.forEach((c) => {
    constructItems[c.code] = items.filter((i) =>
      i.code.startsWith(c.code) || (c.code === "READ" && i.code.startsWith("READ"))
    );
  });

  return (
    <div className="space-y-6">
      {/* ===== HOSPITAL FILTER ===== */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-gray-600">Filter RS:</span>

          {/* Search input with autocomplete */}
          <div className="relative flex-1 max-w-xs">
            <input
              type="text"
              placeholder="Ketik nama rumah sakit..."
              value={hospitalSearch}
              onChange={(e) => setHospitalSearch(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {/* Autocomplete dropdown — show when hospitalSearch.length > 1 */}
            {hospitalSearch.length > 1 && (
              <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {hospitalList
                  .filter(h => h.nama_rs.toLowerCase().includes(hospitalSearch.toLowerCase()))
                  .map(h => (
                    <button
                      key={h.hospital_id}
                      onClick={() => {
                        setHospitalFilter(h.hospital_id);
                        setHospitalSearch("");
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 border-b border-gray-50"
                    >
                      <span className="font-medium">{h.nama_rs}</span>
                      <span className="text-gray-400 ml-2">({h.strata}) · {h.response_count} responden</span>
                    </button>
                  ))
                }
              </div>
            )}
          </div>

          {/* Dropdown select */}
          <select
            value={hospitalFilter || ""}
            onChange={(e) => setHospitalFilter(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white"
          >
            <option value="">Semua RS</option>
            {hospitalList?.map(h => (
              <option key={h.hospital_id} value={h.hospital_id}>
                {h.nama_rs} ({h.strata})
              </option>
            ))}
          </select>

          {/* Reset button — only show when filter active */}
          {hospitalFilter && (
            <button
              onClick={() => { setHospitalFilter(null); setHospitalSearch(""); }}
              className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
            >
              ✕ Reset Filter
            </button>
          )}
        </div>

        {/* Active filter badge */}
        {hospitalFilter && (
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
            📍 {hospitalList?.find(h => h.hospital_id === hospitalFilter)?.nama_rs}
            ({hospitalList?.find(h => h.hospital_id === hospitalFilter)?.strata})
          </div>
        )}
      </div>

      {/* ===== SAMPLE ADEQUACY ===== */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
          Sample Adequacy Check
        </h2>

        {/* Overall verdict */}
        <div className={`rounded-lg p-4 mb-4 ${adequacy.overall ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200"}`}>
          <p className={`text-sm font-semibold ${adequacy.overall ? "text-emerald-800" : "text-amber-800"}`}>
            {adequacy.message}
          </p>
          {excludedCount > 0 && (
            <span className="text-xs text-gray-400 ml-2">
              ({excludedCount} responden di-exclude)
            </span>
          )}
        </div>

        {/* Checklist */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Badge ok={adequacy.nAdequate} label={`n ≥ 300 (${adequacy.n})`} />
          <Badge ok={adequacy.allStrataAdequate} label="Semua strata tercapai" />
          <Badge ok={adequacy.mgaReady} label="MGA ready (≥30/group)" />
          <Badge ok={adequacy.tenTimesRule} label="10× rule PLS-SEM" />
        </div>

        {/* Per strata */}
        <div className="space-y-2">
          {adequacy.strata.map((s) => (
            <div key={s.strata} className="flex items-center gap-3 text-xs">
              <span className="w-24 text-gray-600 font-medium">{s.strata.replace("_", " ")}</span>
              <div className="flex-1">
                <MiniBar
                  value={s.current}
                  max={s.target}
                  color={s.adequate ? "bg-emerald-500" : s.mgaReady ? "bg-amber-500" : "bg-red-400"}
                />
              </div>
              <span className="w-16 text-right font-mono text-gray-600">{s.current}/{s.target}</span>
              <span className="w-6">{s.adequate ? "✓" : s.mgaReady ? "◐" : "✗"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ===== CONSTRUCT STATISTICS + CRONBACH'S ALPHA ===== */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
          Statistik per Konstruk & Reliabilitas
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 pr-3 text-xs font-medium text-gray-500">Konstruk</th>
                <th className="text-center py-2 px-2 text-xs font-medium text-gray-500">Items</th>
                <th className="text-center py-2 px-2 text-xs font-medium text-gray-500">Mean</th>
                <th className="text-center py-2 px-2 text-xs font-medium text-gray-500">SD</th>
                <th className="text-center py-2 px-2 text-xs font-medium text-gray-500">Min</th>
                <th className="text-center py-2 px-2 text-xs font-medium text-gray-500">Max</th>
                <th className="text-center py-2 px-2 text-xs font-medium text-gray-500">α</th>
                <th className="text-center py-2 px-2 text-xs font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {constructs.map((c) => (
                <>
                  <tr
                    key={c.code}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setExpandedConstruct(expandedConstruct === c.code ? null : c.code)}
                  >
                    <td className="py-2.5 pr-3">
                      <span className="font-medium text-gray-900">{c.code}</span>
                      <span className="text-gray-400 ml-1 text-xs">{c.label}</span>
                      <span className="text-gray-300 ml-1 text-xs">{expandedConstruct === c.code ? "▼" : "▶"}</span>
                    </td>
                    <td className="text-center py-2.5 px-2 text-gray-600">{c.itemCount}</td>
                    <td className="text-center py-2.5 px-2 font-mono text-gray-900">{c.mean.toFixed(2)}</td>
                    <td className="text-center py-2.5 px-2 font-mono text-gray-500">{c.stdDev.toFixed(2)}</td>
                    <td className="text-center py-2.5 px-2 font-mono text-gray-400">{c.min.toFixed(1)}</td>
                    <td className="text-center py-2.5 px-2 font-mono text-gray-400">{c.max.toFixed(1)}</td>
                    <td className={`text-center py-2.5 px-2 font-mono font-bold ${c.alphaAdequate ? "text-emerald-600" : "text-red-500"}`}>
                      {c.cronbachAlpha.toFixed(3)}
                    </td>
                    <td className="text-center py-2.5 px-2">
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        c.interpretation === "Excellent" || c.interpretation === "Good"
                          ? "bg-emerald-50 text-emerald-700"
                          : c.interpretation === "Acceptable"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-red-50 text-red-600"
                      }`}>
                        {c.interpretation}
                      </span>
                    </td>
                  </tr>
                  {/* Expanded: show item-level stats */}
                  {expandedConstruct === c.code && constructItems[c.code]?.map((item) => (
                    <tr key={item.code} className="bg-gray-50/50">
                      <td className="py-2 pr-3 pl-6 text-xs text-gray-500">{item.code}</td>
                      <td className="text-center py-2 px-2 text-xs text-gray-400">—</td>
                      <td className="text-center py-2 px-2 font-mono text-xs text-gray-700">{item.mean.toFixed(2)}</td>
                      <td className="text-center py-2 px-2 font-mono text-xs text-gray-500">{item.stdDev.toFixed(2)}</td>
                      <td colSpan={2} className="py-2 px-2">
                        <DistributionBar distribution={item.distribution} n={item.n} />
                      </td>
                      <td colSpan={2} className="py-2 px-2 text-center">
                        {item.lowVariance && (
                          <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">Low var</span>
                        )}
                        {item.missing > 0 && (
                          <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded ml-1">{item.missing} missing</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400">
          <p>Threshold: Cronbach&apos;s α ≥ 0.70 (acceptable). Klik baris konstruk untuk lihat detail item + distribusi.</p>
          <p className="mt-1">Distribusi warna: <span className="text-red-500">■</span> 1 STS &nbsp;
            <span className="text-orange-500">■</span> 2 TS &nbsp;
            <span className="text-amber-500">■</span> 3 ATS &nbsp;
            <span className="text-gray-500">■</span> 4 N &nbsp;
            <span className="text-sky-500">■</span> 5 AS &nbsp;
            <span className="text-blue-600">■</span> 6 S &nbsp;
            <span className="text-emerald-600">■</span> 7 SS
          </p>
        </div>
      </div>

      {/* ===== MISSING DATA & OUTLIERS ===== */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Missing Data */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Missing Data</h2>
          {missingData.totalMissing === 0 ? (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
              <p className="text-sm text-emerald-700 font-medium">✓ Tidak ada missing data</p>
              <p className="text-xs text-emerald-600 mt-1">Semua {data.n} × {items.length} sel terisi lengkap.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-3">
                <p className="text-sm text-amber-700 font-medium">
                  {missingData.totalMissing} missing value(s) ditemukan
                </p>
              </div>
              {Object.entries(missingData.byItem).map(([item, count]) => (
                <div key={item} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 font-medium">{item}</span>
                  <span className="text-red-500 font-mono">{count} missing ({Math.round((count / data.n) * 100)}%)</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Outliers */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Outlier Detection</h2>
          {outliers.count === 0 ? (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
              <p className="text-sm text-emerald-700 font-medium">✓ Tidak ada outlier terdeteksi</p>
              <p className="text-xs text-emerald-600 mt-1">Tidak ada straightlining atau skor ekstrem.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                <p className="text-sm text-amber-700 font-medium">
                  ⚠ {outliers.count} dari {data.n} responden terindikasi outlier ({outliers.percentage.toFixed(2)}%)
                </p>
                {outliers.byType && (
                  <p className="text-xs text-amber-600 mt-1">
                    Straightlining: {outliers.byType.straightlining} · Near-straightlining: {outliers.byType.nearStraightlining} · Skor ekstrem (&gt;3σ): {outliers.byType.extremeScore}
                  </p>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1.5">
                {outliers.details.map((o) => (
                  <div key={o.id} className="flex items-center gap-2 text-xs p-2.5 bg-gray-50 rounded border border-gray-100 flex-wrap">
                    {/* Type badge */}
                    <span className={`shrink-0 px-1.5 py-0.5 rounded font-medium ${
                      o.type === "straightlining"
                        ? "bg-red-100 text-red-700"
                        : o.type === "near-straightlining"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-orange-100 text-orange-700"
                    }`}>
                      {o.type === "straightlining" ? "Straightline" : o.type === "near-straightlining" ? "Near-SL" : "Extreme"}
                    </span>

                    {/* Detail */}
                    <span className="text-gray-600">{o.detail}</span>
                    <span className="text-gray-300">|</span>

                    {/* RS + Strata */}
                    <span className="text-gray-700 font-medium truncate max-w-[200px]" title={o.nama_rs}>
                      {o.nama_rs || "RS tidak diketahui"}
                    </span>
                    <span className="text-gray-400 shrink-0">({o.strata})</span>
                    <span className="text-gray-300">|</span>

                    {/* Profesi */}
                    <span className="text-gray-500 shrink-0">{o.profesi || "-"}</span>

                    {/* Spacer + Exclude button */}
                    <span className="ml-auto" />
                    <button
                      onClick={() => handleExclude(o.id, `${o.type}: ${o.detail}`)}
                      disabled={excluding === o.id}
                      className="shrink-0 px-2.5 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100
                                 transition-colors font-medium disabled:opacity-50"
                    >
                      {excluding === o.id ? "..." : "Exclude"}
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400">
                Klik Exclude untuk soft-delete responden (bisa di-restore).
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ===== EXCLUDED RESPONSES PANEL ===== */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Excluded Responses ({excludedData.length})
          </h3>
          {excludedData.length > 0 && (
            <span className="text-[10px] text-gray-400">
              Soft-deleted — bisa di-restore kapan saja
            </span>
          )}
        </div>

        {excludedLoading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : excludedData.length === 0 ? (
          <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
            <p className="text-sm text-gray-400">Belum ada responden yang di-exclude.</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {excludedData.map((ex) => (
              <div key={ex.id} className="flex items-center gap-2 text-xs p-2.5 bg-red-50/50 rounded border border-red-100 flex-wrap">
                <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-medium shrink-0">
                  Excluded
                </span>
                <span className="text-gray-600 truncate">{ex.excluded_reason}</span>
                <span className="text-gray-300">|</span>
                <span className="text-gray-700 font-medium truncate max-w-[180px]">{ex.nama_rs || "-"}</span>
                <span className="text-gray-400 shrink-0">({ex.strata})</span>
                <span className="text-gray-300">|</span>
                <span className="text-gray-500 shrink-0">{ex.profesi || "-"}</span>
                <span className="ml-auto text-gray-300 text-[10px] shrink-0">
                  {new Date(ex.excluded_at).toLocaleDateString('id-ID')}
                </span>
                <button
                  onClick={() => handleRestore(ex.id)}
                  disabled={restoring === ex.id}
                  className="shrink-0 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded
                             hover:bg-emerald-100 transition-colors font-medium disabled:opacity-50"
                >
                  {restoring === ex.id ? "..." : "Restore"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
