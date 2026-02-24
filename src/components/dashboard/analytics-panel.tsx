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

interface Outlier {
  id: string;
  type: string;
  detail: string;
}

interface AnalyticsData {
  n: number;
  adequacy: Adequacy;
  constructs: ConstructStat[];
  items: ItemStat[];
  missingData: { totalMissing: number; byItem: Record<string, number> };
  outliers: { count: number; percentage: number; details: Outlier[] };
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

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/analytics");
      if (res.status === 401) return;
      if (!res.ok) throw new Error("Gagal memuat analisis");
      setData(await res.json());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

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

  const { adequacy, constructs, items, missingData, outliers } = data;

  // Group items by construct
  const constructItems: Record<string, ItemStat[]> = {};
  constructs.forEach((c) => {
    constructItems[c.code] = items.filter((i) =>
      i.code.startsWith(c.code) || (c.code === "READ" && i.code.startsWith("READ"))
    );
  });

  return (
    <div className="space-y-6">
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
                  ⚠ {outliers.count} responden terindikasi outlier ({outliers.percentage}%)
                </p>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1.5">
                {outliers.details.map((o, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs p-2 bg-gray-50 rounded">
                    <span className={`shrink-0 px-1.5 py-0.5 rounded font-medium ${
                      o.type === "straightlining" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                    }`}>
                      {o.type === "straightlining" ? "Straightline" : o.type === "near-straightlining" ? "Near-SL" : "Extreme"}
                    </span>
                    <span className="text-gray-500">{o.detail}</span>
                    <span className="text-gray-300 ml-auto font-mono text-[10px]">{o.id.slice(0, 8)}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400">
                Pertimbangkan untuk menghapus straightliners sebelum analisis PLS-SEM.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
