-- ============================================================
-- NEON POSTGRES SCHEMA
-- Questionnaire App: BDA-AI Adoption Readiness
-- Run this in: Vercel Dashboard → Storage → Neon → Query Editor
-- ============================================================

-- 1. RESPONSES TABLE (main data)
CREATE TABLE IF NOT EXISTS responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_at TIMESTAMPTZ DEFAULT now(),

  -- Profil Responden
  jenis_rs TEXT NOT NULL,
  kelas_rs TEXT NOT NULL,
  wilayah TEXT NOT NULL,
  profesi TEXT NOT NULL,
  pengalaman TEXT NOT NULL,
  provinsi TEXT,
  hospital_id INTEGER,
  nama_rs TEXT,

  -- A. Infrastruktur Teknologi (TI)
  ti1 SMALLINT NOT NULL CHECK (ti1 BETWEEN 1 AND 7),
  ti2 SMALLINT NOT NULL CHECK (ti2 BETWEEN 1 AND 7),
  ti3 SMALLINT NOT NULL CHECK (ti3 BETWEEN 1 AND 7),
  ti4 SMALLINT NOT NULL CHECK (ti4 BETWEEN 1 AND 7),

  -- B. Dukungan Organisasi (OS)
  os1 SMALLINT NOT NULL CHECK (os1 BETWEEN 1 AND 7),
  os2 SMALLINT NOT NULL CHECK (os2 BETWEEN 1 AND 7),
  os3 SMALLINT NOT NULL CHECK (os3 BETWEEN 1 AND 7),
  os4 SMALLINT NOT NULL CHECK (os4 BETWEEN 1 AND 7),

  -- C. Kapabilitas Data (DC)
  dc1 SMALLINT NOT NULL CHECK (dc1 BETWEEN 1 AND 7),
  dc2 SMALLINT NOT NULL CHECK (dc2 BETWEEN 1 AND 7),
  dc3 SMALLINT NOT NULL CHECK (dc3 BETWEEN 1 AND 7),
  dc4 SMALLINT NOT NULL CHECK (dc4 BETWEEN 1 AND 7),

  -- D. Persepsi Kemudahan Penggunaan (PEOU)
  peou1 SMALLINT NOT NULL CHECK (peou1 BETWEEN 1 AND 7),
  peou2 SMALLINT NOT NULL CHECK (peou2 BETWEEN 1 AND 7),
  peou3 SMALLINT NOT NULL CHECK (peou3 BETWEEN 1 AND 7),
  peou4 SMALLINT NOT NULL CHECK (peou4 BETWEEN 1 AND 7),

  -- E. Persepsi Kegunaan (PU)
  pu1 SMALLINT NOT NULL CHECK (pu1 BETWEEN 1 AND 7),
  pu2 SMALLINT NOT NULL CHECK (pu2 BETWEEN 1 AND 7),
  pu3 SMALLINT NOT NULL CHECK (pu3 BETWEEN 1 AND 7),
  pu4 SMALLINT NOT NULL CHECK (pu4 BETWEEN 1 AND 7),

  -- F. Niat Perilaku (BI)
  bi1 SMALLINT NOT NULL CHECK (bi1 BETWEEN 1 AND 7),
  bi2 SMALLINT NOT NULL CHECK (bi2 BETWEEN 1 AND 7),
  bi3 SMALLINT NOT NULL CHECK (bi3 BETWEEN 1 AND 7),

  -- G. Kesiapan Organisasi (READ) - Formatif
  read1  SMALLINT NOT NULL CHECK (read1  BETWEEN 1 AND 7),
  read2  SMALLINT NOT NULL CHECK (read2  BETWEEN 1 AND 7),
  read3  SMALLINT NOT NULL CHECK (read3  BETWEEN 1 AND 7),
  read4  SMALLINT NOT NULL CHECK (read4  BETWEEN 1 AND 7),
  read_g1 SMALLINT NOT NULL CHECK (read_g1 BETWEEN 1 AND 7)
);

CREATE INDEX IF NOT EXISTS idx_responses_hospital  ON responses(hospital_id);
CREATE INDEX IF NOT EXISTS idx_responses_provinsi  ON responses(provinsi);
CREATE INDEX IF NOT EXISTS idx_responses_submitted ON responses(submitted_at DESC);

-- ============================================================
-- SELESAI. Tidak perlu RLS karena auth dihandle di Next.js API.
-- ============================================================
