"use client";

import { useState, useEffect, useCallback } from "react";
import { AnalyticsPanel } from "@/components/dashboard/analytics-panel";

interface StrataQuota {
  strata: string;
  label: string;
  target: number;
  current: number;
  percentage: number;
}

interface ProvinsiStat {
  provinsi: string;
  current: number;
  targetRS: number;
  targetResp: number;
  percentage: number;
}

interface ProfesiStat {
  profesi: string;
  count: number;
  percentage: number;
}

interface HospitalStat {
  id: number;
  nama: string;
  strata: string;
  provinsi: string;
  kotaKab: string;
  current: number;
  target: number;
  status: "complete" | "partial" | "empty";
}

interface DashboardData {
  totalResponses: number;
  target: number;
  lastSubmission: string | null;
  strataQuota: StrataQuota[];
  provinsiStats: ProvinsiStat[];
  profesiStats: ProfesiStat[];
  hospitalStats: HospitalStat[];
}

function ProgressBar({ current, target, className = "" }: { current: number; target: number; className?: string }) {
  const pct = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
  const color = pct >= 100 ? "bg-emerald-500" : pct >= 70 ? "bg-blue-500" : pct >= 40 ? "bg-amber-500" : "bg-red-400";
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-mono text-gray-600 w-20 text-right">{current}/{target}</span>
      <span className={`text-xs font-medium w-12 text-right ${pct >= 100 ? "text-emerald-600" : pct < 40 ? "text-red-500" : "text-gray-500"}`}>
        {pct}%
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "complete") return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700">✓ Selesai</span>;
  if (status === "partial") return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700">◐ Sebagian</span>;
  return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-500">○ Belum</span>;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [rsFilter, setRsFilter] = useState<"all" | "complete" | "partial" | "empty">("all");
  const [rsSearch, setRsSearch] = useState("");
  const [strataFilter, setStrataFilter] = useState("all");
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [activeTab, setActiveTab] = useState<"monitoring" | "analytics">("monitoring");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (res.status === 401) {
        window.location.href = "/dashboard/login";
        return;
      }
      if (!res.ok) throw new Error("Gagal memuat data");
      const json = await res.json();
      setData(json);
      setError("");
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleExport = async () => {
    try {
      const res = await fetch("/api/dashboard/export");
      if (!res.ok) throw new Error("Gagal export");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `responses_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Gagal mengunduh CSV");
    }
  };

  const handleReset = async (exportFirst: boolean) => {
    setResetting(true);
    try {
      // Export first if requested
      if (exportFirst) {
        await handleExport();
        // Small delay to ensure download starts
        await new Promise((r) => setTimeout(r, 1000));
      }

      const res = await fetch("/api/dashboard/reset", { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || err.error || "Gagal reset");
      }

      const result = await res.json();
      alert(`✓ ${result.message}`);
      setShowResetModal(false);
      fetchData(); // Refresh dashboard
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal mereset data");
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <div className="animate-spin w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-gray-500">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <p className="text-red-600">{error || "Data tidak tersedia"}</p>
          <button onClick={fetchData} className="text-sm text-blue-600 hover:underline">Coba lagi</button>
        </div>
      </div>
    );
  }

  const totalPct = Math.round((data.totalResponses / data.target) * 100);
  const completedRS = data.hospitalStats.filter(h => h.status === "complete").length;
  const partialRS = data.hospitalStats.filter(h => h.status === "partial").length;
  const emptyRS = data.hospitalStats.filter(h => h.status === "empty").length;

  const filteredHospitals = data.hospitalStats.filter(h => {
    if (rsFilter !== "all" && h.status !== rsFilter) return false;
    if (strataFilter !== "all" && h.strata !== strataFilter) return false;
    if (rsSearch && !h.nama.toLowerCase().includes(rsSearch.toLowerCase()) && !h.provinsi.toLowerCase().includes(rsSearch.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Dashboard Monitoring Kuesioner</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Auto-refresh 30 detik · Terakhir: {lastRefresh.toLocaleTimeString("id-ID")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchData}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                ↻ Refresh
              </button>
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white hover:bg-gray-800 transition-colors"
              >
                ↓ Export CSV
              </button>
              <button
                onClick={() => setShowResetModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                ⟲ Reset Data
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Tab Navigation */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab("monitoring")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "monitoring"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            📊 Monitoring
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "analytics"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            🔬 Analisis Data
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "analytics" ? (
          <AnalyticsPanel />
        ) : (
        <>
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Responden</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {data.totalResponses}<span className="text-sm font-normal text-gray-400">/{data.target}</span>
            </p>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${totalPct >= 100 ? "bg-emerald-500" : "bg-blue-500"}`} style={{ width: `${Math.min(totalPct, 100)}%` }} />
            </div>
            <p className="text-xs text-gray-500 mt-1">{totalPct}% tercapai</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">RS Selesai</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {completedRS}<span className="text-sm font-normal text-gray-400">/100</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">{partialRS} sebagian · {emptyRS} belum</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Respons Terakhir</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {data.lastSubmission ? timeAgo(data.lastSubmission) : "—"}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Strata Penuh</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {data.strataQuota.filter(s => s.current >= s.target).length}<span className="text-sm font-normal text-gray-400">/5</span>
            </p>
          </div>
        </div>

        {/* Strata Quota */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Kuota per Strata</h2>
          <div className="space-y-4">
            {data.strataQuota.map((s) => (
              <div key={s.strata}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">{s.label}</span>
                  {s.current >= s.target && <span className="text-xs text-emerald-600 font-medium">✓ Tercapai</span>}
                </div>
                <ProgressBar current={s.current} target={s.target} />
              </div>
            ))}
          </div>
        </div>

        {/* Province & Profesi Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Province Stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Per Provinsi</h2>
            <div className="space-y-3">
              {data.provinsiStats.map((p) => (
                <div key={p.provinsi}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">{p.provinsi}</span>
                    <span className="text-xs text-gray-400">{p.targetRS} RS</span>
                  </div>
                  <ProgressBar current={p.current} target={p.targetResp} />
                </div>
              ))}
            </div>
          </div>

          {/* Profesi Stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Distribusi Profesi</h2>
            {data.profesiStats.length === 0 ? (
              <p className="text-sm text-gray-400">Belum ada data</p>
            ) : (
              <div className="space-y-3">
                {data.profesiStats.sort((a, b) => b.count - a.count).map((p) => (
                  <div key={p.profesi} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 flex-1">{p.profesi}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${p.percentage}%` }} />
                      </div>
                      <span className="text-sm font-mono text-gray-600 w-8 text-right">{p.count}</span>
                      <span className="text-xs text-gray-400 w-10 text-right">{p.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Ideal balance note */}
            <div className="mt-6 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">
                <span className="font-medium">Target ideal:</span> ~1/3 Manajemen, ~1/3 IT/SI, ~1/3 Medis per RS
              </p>
            </div>
          </div>
        </div>

        {/* Hospital Table */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Status per Rumah Sakit</h2>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Cari RS..."
                value={rsSearch}
                onChange={(e) => setRsSearch(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs w-40 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <select
                value={rsFilter}
                onChange={(e) => setRsFilter(e.target.value as typeof rsFilter)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Semua Status</option>
                <option value="complete">✓ Selesai</option>
                <option value="partial">◐ Sebagian</option>
                <option value="empty">○ Belum</option>
              </select>
              <select
                value={strataFilter}
                onChange={(e) => setStrataFilter(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Semua Strata</option>
                <option value="Publik_A">Publik A</option>
                <option value="Publik_B">Publik B</option>
                <option value="Publik_C">Publik C</option>
                <option value="Swasta_AB">Swasta A&B</option>
                <option value="Swasta_C">Swasta C</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase">No</th>
                  <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase">Nama RS</th>
                  <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase">Strata</th>
                  <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase">Provinsi</th>
                  <th className="text-center py-2 pr-4 text-xs font-medium text-gray-500 uppercase">Responden</th>
                  <th className="text-center py-2 text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredHospitals.map((h, i) => (
                  <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 pr-4 text-gray-400 text-xs">{i + 1}</td>
                    <td className="py-2.5 pr-4">
                      <div className="font-medium text-gray-900 text-sm">{h.nama}</div>
                      <div className="text-xs text-gray-400">{h.kotaKab}</div>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                        {h.strata.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-sm text-gray-600">{h.provinsi}</td>
                    <td className="py-2.5 pr-4 text-center font-mono text-sm">
                      <span className={h.current >= h.target ? "text-emerald-600 font-bold" : h.current > 0 ? "text-amber-600" : "text-gray-400"}>
                        {h.current}
                      </span>
                      <span className="text-gray-300">/{h.target}</span>
                    </td>
                    <td className="py-2.5 text-center"><StatusBadge status={h.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredHospitals.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">Tidak ada RS yang sesuai filter.</p>
          )}

          <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
            Menampilkan {filteredHospitals.length} dari {data.hospitalStats.length} RS
          </div>
        </div>
        </>
        )}
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-3">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Reset Semua Data?</h3>
              <p className="text-sm text-gray-500 mt-2">
                Tindakan ini akan <span className="font-semibold text-red-600">menghapus semua {data.totalResponses} respons</span> dari database secara permanen.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleReset(true)}
                disabled={resetting}
                className="w-full rounded-lg bg-amber-500 px-4 py-3 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                {resetting ? "Memproses..." : "📥 Export CSV dulu, lalu Hapus Semua"}
              </button>
              <button
                onClick={() => handleReset(false)}
                disabled={resetting}
                className="w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {resetting ? "Menghapus..." : "🗑️ Hapus Semua Tanpa Export"}
              </button>
              <button
                onClick={() => setShowResetModal(false)}
                disabled={resetting}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Batal
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center">
              Data yang sudah dihapus tidak dapat dikembalikan.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
