-- ============================================================
-- MIGRASI: Tabel audit_log untuk traceability backup/restore
-- Tanggal: 2026-05-19
-- Oleh: Doctoral Co-Pilot (Asmuliardi Muluk, UNAND)
--
-- Mendukung Locked Constraint #8: data responden sacrosanct.
-- Setiap operasi export, import, atau soft-update direkam di sini.
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id            BIGSERIAL PRIMARY KEY,
  ts            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  action        TEXT NOT NULL,            -- 'export' | 'import_dry_run' | 'import_apply' | 'soft_update' | 'insert'
  table_name    TEXT,
  row_id        TEXT,
  field_name    TEXT,
  old_value     TEXT,
  new_value     TEXT,
  rows_affected INTEGER,
  meta          JSONB,
  notes         TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_log_ts        ON audit_log(ts DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action    ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_row ON audit_log(table_name, row_id);

-- Verifikasi: SELECT COUNT(*) FROM audit_log;  -- harus return 0
