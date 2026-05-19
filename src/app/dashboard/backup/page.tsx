"use client";

// =============================================================
// /dashboard/backup
// UI download backup + upload restore (soft-merge).
// Memakai cookie auth yang sama dengan /dashboard.
// =============================================================

import { useState } from "react";
import Link from "next/link";

type Summary = {
  table: string;
  rows_in_file: number;
  rows_in_db: number;
  inserts: number;
  updates: number;
  unchanged: number;
  skipped_no_pk: number;
  warnings: string[];
};

type ChangeRecord = {
  table: string;
  row_id: string;
  type: "insert" | "update";
  fields?: { name: string; old: unknown; new: unknown }[];
  full_row?: Record<string, unknown>;
};

type ImportResult = {
  ok: boolean;
  mode: string;
  timestamp: string;
  file: { name: string; size: number };
  summaries: Summary[];
  total_changes: number;
  preview_changes: ChangeRecord[];
  truncated: boolean;
  errors: string[];
  note: string;
};

export default function BackupPage() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [tableHint, setTableHint] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleDownload(format: "json" | "csv-zip") {
    setDownloading(format);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/export?format=${format}`);
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`HTTP ${res.status}: ${t}`);
      }
      const blob = await res.blob();
      const disp = res.headers.get("content-disposition") || "";
      const m = disp.match(/filename="([^"]+)"/);
      const filename = m
        ? m[1]
        : `backup.${format === "json" ? "json" : "zip"}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErr(String(e));
    } finally {
      setDownloading(null);
    }
  }

  async function handleUpload(apply: boolean) {
    if (!file) {
      setErr("Pilih file dulu");
      return;
    }
    setBusy(true);
    setErr(null);
    if (!apply) setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const qs = new URLSearchParams();
      if (apply) qs.set("apply", "true");
      if (tableHint && file.name.toLowerCase().endsWith(".csv")) {
        qs.set("table", tableHint);
      }
      const res = await fetch(`/api/admin/import?${qs.toString()}`, {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setResult(json as ImportResult);
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Backup &amp; Restore Data</h1>
        <p className="text-sm text-gray-600 mt-1">
          Download snapshot data lengkap dari Neon Postgres dan restore
          (soft-merge) jika ada data rusak. Operasi restore TIDAK PERNAH
          menghapus row — hanya menambah baru atau memperbarui field.
        </p>
        <Link
          href="/dashboard"
          className="inline-block mt-2 text-sm text-blue-600 hover:underline"
        >
          ← Kembali ke Dashboard
        </Link>
      </header>

      {/* ============ DOWNLOAD ============ */}
      <section className="border rounded-lg p-5 bg-white">
        <h2 className="text-lg font-semibold mb-3">1. Download Backup</h2>
        <p className="text-sm text-gray-600 mb-4">
          Download semua tabel sekaligus. Disarankan simpan kedua format:
          CSV ZIP untuk audit di Excel, JSON sebagai master untuk restore.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleDownload("csv-zip")}
            disabled={downloading !== null}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {downloading === "csv-zip"
              ? "Mendownload..."
              : "⬇ Download CSV ZIP (untuk Excel)"}
          </button>
          <button
            onClick={() => handleDownload("json")}
            disabled={downloading !== null}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 disabled:opacity-50"
          >
            {downloading === "json"
              ? "Mendownload..."
              : "⬇ Download JSON (master, untuk restore)"}
          </button>
        </div>
      </section>

      {/* ============ UPLOAD ============ */}
      <section className="border rounded-lg p-5 bg-white">
        <h2 className="text-lg font-semibold mb-3">2. Restore dari Backup</h2>
        <p className="text-sm text-gray-600 mb-4">
          Upload file backup (.json, .zip, atau .csv). Sistem akan
          membandingkan dengan data sekarang dan menampilkan{" "}
          <strong>preview perubahan</strong> sebelum apa-apa di-commit.
        </p>

        <div className="space-y-3">
          <input
            type="file"
            accept=".json,.zip,.csv"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              setResult(null);
            }}
            className="block w-full text-sm border rounded p-2"
          />

          {file && file.name.toLowerCase().endsWith(".csv") && (
            <div>
              <label className="text-sm block mb-1">
                Nama tabel (wajib untuk upload single CSV):
              </label>
              <input
                type="text"
                value={tableHint}
                onChange={(e) => setTableHint(e.target.value)}
                placeholder="contoh: responses"
                className="border rounded px-2 py-1 text-sm w-64"
              />
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => handleUpload(false)}
              disabled={!file || busy}
              className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50"
            >
              {busy ? "Memproses..." : "🔍 Preview Perubahan (Dry-Run)"}
            </button>
            <button
              onClick={() => {
                if (
                  confirm(
                    "Yakin commit perubahan ke database?\n\nOperasi ini hanya INSERT/UPDATE — tidak ada DELETE. Tetap lanjut?",
                  )
                ) {
                  handleUpload(true);
                }
              }}
              disabled={!file || busy || !result || result.mode === "apply"}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              title={
                !result ? "Jalankan Dry-Run dulu untuk review" : ""
              }
            >
              ✓ Commit Perubahan
            </button>
          </div>
        </div>

        {err && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
            <strong>Error:</strong> {err}
          </div>
        )}
      </section>

      {/* ============ RESULT ============ */}
      {result && (
        <section className="border rounded-lg p-5 bg-white">
          <h2 className="text-lg font-semibold mb-3">
            Hasil {result.mode === "apply" ? "Restore" : "Dry-Run"}
          </h2>
          <p
            className={`text-sm mb-4 p-3 rounded ${
              result.mode === "apply"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-yellow-50 text-yellow-800 border border-yellow-200"
            }`}
          >
            {result.note}
          </p>

          <div className="text-sm mb-3">
            <strong>File:</strong> {result.file.name} ({result.file.size} bytes)
            <span className="ml-4">
              <strong>Total perubahan:</strong> {result.total_changes}
            </span>
          </div>

          <div className="overflow-x-auto mb-4">
            <table className="text-sm w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-2 py-1 text-left">Tabel</th>
                  <th className="border px-2 py-1">File</th>
                  <th className="border px-2 py-1">DB</th>
                  <th className="border px-2 py-1 text-green-700">Insert</th>
                  <th className="border px-2 py-1 text-blue-700">Update</th>
                  <th className="border px-2 py-1 text-gray-500">Sama</th>
                  <th className="border px-2 py-1 text-orange-600">Skip</th>
                  <th className="border px-2 py-1">Warnings</th>
                </tr>
              </thead>
              <tbody>
                {result.summaries.map((s) => (
                  <tr key={s.table}>
                    <td className="border px-2 py-1 font-mono">{s.table}</td>
                    <td className="border px-2 py-1 text-center">
                      {s.rows_in_file}
                    </td>
                    <td className="border px-2 py-1 text-center">
                      {s.rows_in_db < 0 ? "—" : s.rows_in_db}
                    </td>
                    <td className="border px-2 py-1 text-center text-green-700">
                      {s.inserts}
                    </td>
                    <td className="border px-2 py-1 text-center text-blue-700">
                      {s.updates}
                    </td>
                    <td className="border px-2 py-1 text-center text-gray-500">
                      {s.unchanged}
                    </td>
                    <td className="border px-2 py-1 text-center text-orange-600">
                      {s.skipped_no_pk}
                    </td>
                    <td className="border px-2 py-1 text-xs text-red-700">
                      {s.warnings.length > 0 ? s.warnings.join("; ") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result.preview_changes.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium">
                Preview {result.preview_changes.length} perubahan pertama
                {result.truncated && " (dipotong dari total)"}
              </summary>
              <pre className="mt-2 p-3 bg-gray-50 text-xs overflow-x-auto max-h-96 border rounded">
                {JSON.stringify(result.preview_changes, null, 2)}
              </pre>
            </details>
          )}
        </section>
      )}

      <footer className="text-xs text-gray-500 pt-4 border-t">
        <p>
          🔒 Locked Constraint #8: Data responden bersifat sacrosanct.
          Endpoint <code className="bg-gray-100 px-1">/api/admin/import</code>{" "}
          hanya melakukan INSERT atau UPDATE field — tidak pernah DELETE.
          Setiap perubahan dicatat di tabel{" "}
          <code className="bg-gray-100 px-1">audit_log</code>.
        </p>
      </footer>
    </div>
  );
}
