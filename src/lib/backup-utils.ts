// =============================================================
// backup-utils.ts
// Helper untuk fitur backup/restore data responden.
//
// Prinsip:
//  - Universal: introspeksi schema dari information_schema.
//  - Soft-restore: TIDAK PERNAH DELETE. INSERT atau UPDATE saja.
//    (Locked Constraint #8 — data responden sacrosanct.)
//  - Auditability: setiap perubahan dicatat ke audit_log.
// =============================================================

import { NextRequest } from "next/server";
import { getDb } from "@/lib/supabase";

// Tabel sistem yang JANGAN ikut di-backup/restore
const EXCLUDED_TABLES = new Set<string>([
  "pg_stat_statements",
  "schema_migrations",
]);

// Tabel yang TIDAK boleh di-restore (read-only di sisi import)
// audit_log self-restore akan menyebabkan loop log.
export const RESTORE_BLOCKLIST = new Set<string>([
  "audit_log",
]);

export function checkAuth(request: NextRequest): boolean {
  const cookie = request.cookies.get("dashboard_auth");
  return cookie?.value === (process.env.DASHBOARD_PASSWORD || "Arsanka01");
}

export function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export interface TableSchema {
  table_name: string;
  primary_keys: string[];
  columns: string[];
}

/**
 * Quote SQL identifier (table/column name) — escape kutip ganda.
 * Pakai ini SELALU sebelum embed identifier ke string SQL.
 */
export function qIdent(name: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    // Strict: hanya izinkan identifier "aman" tanpa karakter aneh
    throw new Error(`Unsafe identifier: ${name}`);
  }
  return `"${name}"`;
}

/**
 * Introspeksi semua tabel user di public schema.
 */
export async function listUserTables(): Promise<TableSchema[]> {
  const sql = getDb();

  const tables = (await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `) as { table_name: string }[];

  const result: TableSchema[] = [];

  for (const t of tables) {
    if (EXCLUDED_TABLES.has(t.table_name)) continue;

    const cols = (await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${t.table_name}
      ORDER BY ordinal_position
    `) as { column_name: string }[];

    const pks = (await sql`
      SELECT a.attname AS column_name
      FROM pg_index i
      JOIN pg_attribute a
        ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      JOIN pg_class c ON c.oid = i.indrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = ${t.table_name}
        AND i.indisprimary
    `) as { column_name: string }[];

    result.push({
      table_name: t.table_name,
      primary_keys: pks.map((p) => p.column_name),
      columns: cols.map((c) => c.column_name),
    });
  }

  return result;
}

/**
 * Konversi array of objects → CSV string (RFC 4180-ish).
 */
export function toCsv(
  rows: Record<string, unknown>[],
  columns: string[],
): string {
  const escape = (v: unknown): string => {
    if (v === null || v === undefined) return "";
    let s: string;
    if (v instanceof Date) s = v.toISOString();
    else if (typeof v === "object") s = JSON.stringify(v);
    else s = String(v);
    if (/[",\n\r]/.test(s)) {
      s = '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };

  const header = columns.map(escape).join(",");
  const body = rows
    .map((r) => columns.map((c) => escape(r[c])).join(","))
    .join("\n");
  return header + "\n" + body + "\n";
}

/**
 * Parser CSV minimal (RFC 4180 quoted-field aware).
 */
export function fromCsv(csv: string): Record<string, string>[] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const s = csv.replace(/\r\n/g, "\n");

  while (i < s.length) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"' && s[i + 1] === '"') {
        field += '"';
        i += 2;
        continue;
      }
      if (ch === '"') {
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
        continue;
      }
      if (ch === ",") {
        cur.push(field);
        field = "";
        i++;
        continue;
      }
      if (ch === "\n") {
        cur.push(field);
        rows.push(cur);
        cur = [];
        field = "";
        i++;
        continue;
      }
      field += ch;
      i++;
    }
  }
  if (field.length > 0 || cur.length > 0) {
    cur.push(field);
    rows.push(cur);
  }

  if (rows.length === 0) return [];
  const header = rows[0];
  const out: Record<string, string>[] = [];
  for (let r = 1; r < rows.length; r++) {
    if (rows[r].length === 1 && rows[r][0] === "") continue;
    const obj: Record<string, string> = {};
    for (let c = 0; c < header.length; c++) {
      obj[header[c]] = rows[r][c] ?? "";
    }
    out.push(obj);
  }
  return out;
}

/**
 * Konversi string CSV cell → tipe Postgres-friendly.
 * "" → null; "true"/"false" → boolean; integer/decimal murni → number.
 * Yang lain tetap string (biarkan Postgres yang cast).
 */
export function csvCellToJs(v: string): unknown {
  if (v === "") return null;
  if (v === "true" || v === "TRUE") return true;
  if (v === "false" || v === "FALSE") return false;
  // Hati-hati: angka panjang (>15 digit) bisa kena floating-point loss.
  // Untuk UUID atau ID besar tetap string.
  if (/^-?\d+$/.test(v) && v.length <= 15) {
    return Number(v);
  }
  if (/^-?\d+\.\d+$/.test(v)) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return v;
}

export function nowIso(): string {
  return new Date().toISOString();
}
