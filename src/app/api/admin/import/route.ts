// =============================================================
// POST /api/admin/import
//
// Soft-restore dari backup. TIDAK PERNAH MENGHAPUS row.
//   - Row dengan PK yang sudah ada → UPDATE field-per-field
//     (hanya kolom yang nilainya berubah).
//   - Row dengan PK baru → INSERT.
//   - Row di DB yang tidak ada di file → DIBIARKAN.
//
// Mode:
//   - default → dry-run (preview)
//   - ?apply=true → commit
//
// File format:
//   - .json  → bundle hasil export ?format=json
//   - .zip   → bundle hasil export ?format=csv-zip
//   - .csv   → 1 tabel saja, butuh ?table=<nama>
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/supabase";
import {
  checkAuth,
  listUserTables,
  fromCsv,
  csvCellToJs,
  getClientIp,
  nowIso,
  qIdent,
  RESTORE_BLOCKLIST,
  TableSchema,
} from "@/lib/backup-utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface ChangeRecord {
  table: string;
  row_id: string;
  type: "insert" | "update";
  fields?: { name: string; old: unknown; new: unknown }[];
  full_row?: Record<string, unknown>;
}

interface ImportSummary {
  table: string;
  rows_in_file: number;
  rows_in_db: number;
  inserts: number;
  updates: number;
  unchanged: number;
  skipped_no_pk: number;
  warnings: string[];
}

function eq(a: unknown, b: unknown): boolean {
  const na = a === null || a === undefined || a === "";
  const nb = b === null || b === undefined || b === "";
  if (na && nb) return true;
  if (na !== nb) return false;
  if (typeof a === "number" || typeof b === "number") {
    return String(a) === String(b);
  }
  if (a instanceof Date) return a.toISOString() === String(b);
  if (b instanceof Date) return b.toISOString() === String(a);
  if (typeof a === "object" || typeof b === "object") {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return a === b;
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apply = request.nextUrl.searchParams.get("apply") === "true";
  const tableOverride = request.nextUrl.searchParams.get("table") || "";
  const sql = getDb();

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (e) {
    return NextResponse.json(
      {
        error: "Expected multipart/form-data with field 'file'",
        details: String(e),
      },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing 'file' field" }, { status: 400 });
  }

  // -------- Parse file --------
  const payload: Record<string, Record<string, unknown>[]> = {};
  const name = file.name.toLowerCase();

  try {
    if (name.endsWith(".json")) {
      const txt = await file.text();
      const parsed = JSON.parse(txt);
      const data =
        parsed.data && typeof parsed.data === "object" ? parsed.data : parsed;
      for (const k of Object.keys(data)) {
        if (Array.isArray(data[k])) payload[k] = data[k];
      }
    } else if (name.endsWith(".zip")) {
      const JSZip = (await import("jszip")).default;
      const buf = Buffer.from(await file.arrayBuffer());
      const zip = await JSZip.loadAsync(buf);
      for (const fname of Object.keys(zip.files)) {
        if (!fname.endsWith(".csv")) continue;
        if (fname.startsWith("_")) continue; // skip _meta.json kalau ke-bypass
        const tname = fname.replace(/\.csv$/, "");
        const csv = await zip.files[fname].async("string");
        const rows = fromCsv(csv);
        payload[tname] = rows.map((r) => {
          const out: Record<string, unknown> = {};
          for (const k of Object.keys(r)) out[k] = csvCellToJs(r[k]);
          return out;
        });
      }
    } else if (name.endsWith(".csv")) {
      if (!tableOverride) {
        return NextResponse.json(
          { error: "Single CSV upload requires ?table=<name> query param" },
          { status: 400 },
        );
      }
      const txt = await file.text();
      const rows = fromCsv(txt);
      payload[tableOverride] = rows.map((r) => {
        const out: Record<string, unknown> = {};
        for (const k of Object.keys(r)) out[k] = csvCellToJs(r[k]);
        return out;
      });
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Use .json, .zip, or .csv" },
        { status: 400 },
      );
    }
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to parse file", details: String(e) },
      { status: 400 },
    );
  }

  // -------- Schema introspection --------
  const allTables = await listUserTables();
  const schemaMap = new Map<string, TableSchema>();
  for (const t of allTables) schemaMap.set(t.table_name, t);

  const summaries: ImportSummary[] = [];
  const changes: ChangeRecord[] = [];
  const errors: string[] = [];

  for (const table of Object.keys(payload)) {
    if (RESTORE_BLOCKLIST.has(table)) {
      summaries.push({
        table,
        rows_in_file: payload[table].length,
        rows_in_db: -1,
        inserts: 0,
        updates: 0,
        unchanged: 0,
        skipped_no_pk: 0,
        warnings: ["Table in RESTORE_BLOCKLIST — skipped"],
      });
      continue;
    }

    const schema = schemaMap.get(table);
    if (!schema) {
      summaries.push({
        table,
        rows_in_file: payload[table].length,
        rows_in_db: -1,
        inserts: 0,
        updates: 0,
        unchanged: 0,
        skipped_no_pk: 0,
        warnings: ["Table not found in current DB — skipped"],
      });
      continue;
    }

    const pks = schema.primary_keys;
    if (pks.length === 0) {
      summaries.push({
        table,
        rows_in_file: payload[table].length,
        rows_in_db: -1,
        inserts: 0,
        updates: 0,
        unchanged: 0,
        skipped_no_pk: payload[table].length,
        warnings: ["Table has no primary key — soft-restore unsafe, skipped"],
      });
      continue;
    }

    const tIdent = qIdent(table);
    const existing = (await sql.query(
      `SELECT * FROM ${tIdent}`,
    )) as Record<string, unknown>[];

    const pkKey = (r: Record<string, unknown>) =>
      pks.map((p) => String(r[p] ?? "")).join("||");

    const existingMap = new Map<string, Record<string, unknown>>();
    for (const r of existing) existingMap.set(pkKey(r), r);

    let inserts = 0;
    let updates = 0;
    let unchanged = 0;
    let skipped = 0;
    const warns: string[] = [];

    for (const row of payload[table]) {
      // Filter kolom yang tidak ada di schema saat ini
      const known: Record<string, unknown> = {};
      for (const c of schema.columns) {
        if (c in row) known[c] = row[c];
      }

      // Skip jika PK kosong
      if (
        pks.some(
          (p) => known[p] === null || known[p] === undefined || known[p] === "",
        )
      ) {
        skipped++;
        continue;
      }

      const key = pkKey(known);
      const existingRow = existingMap.get(key);

      if (!existingRow) {
        // ----- INSERT -----
        const cols = Object.keys(known);
        if (cols.length === 0) {
          skipped++;
          continue;
        }

        let didInsert = false;
        if (apply) {
          try {
            const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
            const colIdents = cols.map((c) => qIdent(c)).join(", ");
            const vals = cols.map((c) => known[c]);
            await sql.query(
              `INSERT INTO ${tIdent} (${colIdents})
               VALUES (${placeholders})
               ON CONFLICT DO NOTHING`,
              vals,
            );

            // Log per-insert ke audit_log
            try {
              await sql.query(
                `INSERT INTO audit_log
                   (action, table_name, row_id, new_value, meta)
                 VALUES ($1, $2, $3, $4, $5::jsonb)`,
                [
                  "insert",
                  table,
                  key,
                  JSON.stringify(known),
                  JSON.stringify({ source: "import", file_name: file.name }),
                ],
              );
            } catch {
              // audit_log mungkin belum ada
            }
            didInsert = true;
          } catch (e) {
            warns.push(`Insert failed for ${key}: ${String(e)}`);
          }
        } else {
          didInsert = true; // dry-run anggap berhasil
        }

        if (didInsert) {
          inserts++;
          changes.push({
            table,
            row_id: key,
            type: "insert",
            full_row: known,
          });
        }
      } else {
        // ----- UPDATE only changed fields -----
        const diff: { name: string; old: unknown; new: unknown }[] = [];
        for (const c of schema.columns) {
          if (pks.includes(c)) continue; // jangan ubah PK
          if (!(c in known)) continue;
          if (!eq(existingRow[c], known[c])) {
            diff.push({ name: c, old: existingRow[c], new: known[c] });
          }
        }

        if (diff.length === 0) {
          unchanged++;
          continue;
        }

        let didUpdate = false;
        if (apply) {
          try {
            const setClauses = diff
              .map((d, i) => `${qIdent(d.name)} = $${i + 1}`)
              .join(", ");
            const whereStart = diff.length;
            const whereClauses = pks
              .map((p, i) => `${qIdent(p)} = $${whereStart + i + 1}`)
              .join(" AND ");

            const params: unknown[] = [
              ...diff.map((d) => d.new),
              ...pks.map((p) => existingRow[p]),
            ];

            await sql.query(
              `UPDATE ${tIdent} SET ${setClauses} WHERE ${whereClauses}`,
              params,
            );

            // Log per-field change ke audit_log
            for (const d of diff) {
              try {
                await sql.query(
                  `INSERT INTO audit_log
                     (action, table_name, row_id, field_name, old_value, new_value, meta)
                   VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
                  [
                    "soft_update",
                    table,
                    key,
                    d.name,
                    d.old === null || d.old === undefined ? null : String(d.old),
                    d.new === null || d.new === undefined ? null : String(d.new),
                    JSON.stringify({ source: "import", file_name: file.name }),
                  ],
                );
              } catch {
                // audit_log mungkin belum ada
              }
            }
            didUpdate = true;
          } catch (e) {
            warns.push(`Update failed for ${key}: ${String(e)}`);
          }
        } else {
          didUpdate = true; // dry-run anggap berhasil
        }

        if (didUpdate) {
          updates++;
          changes.push({
            table,
            row_id: key,
            type: "update",
            fields: diff,
          });
        }
      }
    }

    summaries.push({
      table,
      rows_in_file: payload[table].length,
      rows_in_db: existing.length,
      inserts,
      updates,
      unchanged,
      skipped_no_pk: skipped,
      warnings: warns,
    });
  }

  // -------- Audit log untuk operasi level batch --------
  try {
    await sql.query(
      `INSERT INTO audit_log (action, rows_affected, meta, notes)
       VALUES ($1, $2, $3::jsonb, $4)`,
      [
        apply ? "import_apply" : "import_dry_run",
        changes.length,
        JSON.stringify({
          file_name: file.name,
          file_size: file.size,
          ip: getClientIp(request),
          summaries,
        }),
        apply ? "Soft-restore applied" : "Dry-run preview",
      ],
    );
  } catch {
    errors.push("audit_log insert failed (table may not exist yet)");
  }

  return NextResponse.json({
    ok: true,
    mode: apply ? "apply" : "dry-run",
    timestamp: nowIso(),
    file: { name: file.name, size: file.size },
    summaries,
    total_changes: changes.length,
    preview_changes: changes.slice(0, 200),
    truncated: changes.length > 200,
    errors,
    note: apply
      ? "Perubahan SUDAH di-commit. Cek tabel audit_log untuk log lengkap."
      : "Ini DRY-RUN. Tambahkan ?apply=true (atau klik tombol Commit) untuk benar-benar menerapkan perubahan.",
  });
}
