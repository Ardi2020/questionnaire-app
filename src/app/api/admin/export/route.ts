// =============================================================
// GET /api/admin/export?format=json|csv-zip
// Download snapshot full database (semua tabel public schema).
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/supabase";
import {
  checkAuth,
  listUserTables,
  toCsv,
  getClientIp,
  nowIso,
  qIdent,
} from "@/lib/backup-utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const format = (
    request.nextUrl.searchParams.get("format") || "json"
  ).toLowerCase();
  const sql = getDb();

  try {
    const tables = await listUserTables();
    const snapshot: Record<string, unknown[]> = {};
    const counts: Record<string, number> = {};

    for (const t of tables) {
      // sql.query() untuk SQL string biasa (identifier tidak bisa
      // di-parametric, jadi pakai qIdent yang strict-validate nama).
      const rows = (await sql.query(
        `SELECT * FROM ${qIdent(t.table_name)}`,
      )) as Record<string, unknown>[];
      snapshot[t.table_name] = rows;
      counts[t.table_name] = rows.length;
    }

    const ts = nowIso();
    const meta = {
      version: "1.0.0",
      generated_at: ts,
      generator: "questionnaire-app admin backup",
      database: "neon-postgres",
      tables: tables.map((t) => ({
        name: t.table_name,
        primary_keys: t.primary_keys,
        columns: t.columns,
        row_count: counts[t.table_name],
      })),
    };

    // Catat ke audit_log (best-effort)
    try {
      const totalRows = Object.values(counts).reduce((a, b) => a + b, 0);
      const metaJson = JSON.stringify({
        format,
        ip: getClientIp(request),
        user_agent: request.headers.get("user-agent"),
        counts,
      });
      await sql.query(
        `INSERT INTO audit_log (action, rows_affected, meta, notes)
         VALUES ($1, $2, $3::jsonb, $4)`,
        ["export", totalRows, metaJson, "Export " + format + " by dashboard"],
      );
    } catch {
      // audit_log mungkin belum dibuat — jangan blocking export
    }

    const fnameTs = ts.replace(/[:.]/g, "-");

    if (format === "json") {
      const body = JSON.stringify({ meta, data: snapshot }, null, 2);
      return new NextResponse(body, {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="backup-${fnameTs}.json"`,
          "X-Backup-Tables": String(tables.length),
        },
      });
    }

    if (format === "csv-zip") {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      zip.file(
        "README.txt",
        [
          "Backup snapshot — questionnaire-app",
          "Generated at: " + ts,
          "Tables: " + tables.map((t) => t.table_name).join(", "),
          "Total rows: " + Object.values(counts).reduce((a, b) => a + b, 0),
          "",
          "Setiap tabel disimpan sebagai .csv terpisah dengan urutan",
          "kolom sesuai information_schema. UNTUK RESTORE, upload",
          "file ZIP ini ke /dashboard/backup.",
        ].join("\n"),
      );

      zip.file("_meta.json", JSON.stringify(meta, null, 2));

      for (const t of tables) {
        const rows = snapshot[t.table_name] as Record<string, unknown>[];
        const csv = toCsv(rows, t.columns);
        zip.file(t.table_name + ".csv", csv);
      }

      const buf = await zip.generateAsync({
        type: "nodebuffer",
        compression: "DEFLATE",
      });
      return new NextResponse(new Uint8Array(buf), {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="backup-${fnameTs}.zip"`,
          "X-Backup-Tables": String(tables.length),
        },
      });
    }

    return NextResponse.json(
      { error: "Unknown format. Use ?format=json or ?format=csv-zip" },
      { status: 400 },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Export failed", details: msg },
      { status: 500 },
    );
  }
}
