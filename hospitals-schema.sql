-- ============================================================
-- HOSPITALS TABLE
-- Questionnaire App: Sampling frame 100 RS target
-- Run this in: Neon Console → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS hospitals (
  id SERIAL PRIMARY KEY,
  no_urut SMALLINT NOT NULL UNIQUE,           -- Nomor urut 1-100
  nama_rs TEXT NOT NULL,                       -- Nama RS
  kelas_rs TEXT NOT NULL,                      -- Kelas strata sampling (A/B/C)
  kelas_terkini TEXT,                          -- Kelas aktual 2025/2026
  kepemilikan TEXT NOT NULL,                   -- Publik/Swasta
  strata TEXT NOT NULL,                        -- Strata: Publik_A, Publik_B, Publik_C, Swasta_AB, Swasta_C
  target_mga SMALLINT,                         -- Target responden untuk Multi-Group Analysis
  provinsi TEXT NOT NULL,                      -- Provinsi
  kota_kabupaten TEXT NOT NULL,                -- Kota/Kabupaten
  is_active BOOLEAN DEFAULT true,              -- Status aktif (untuk replacement)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hospitals_strata ON hospitals(strata);
CREATE INDEX IF NOT EXISTS idx_hospitals_provinsi ON hospitals(provinsi);
CREATE INDEX IF NOT EXISTS idx_hospitals_is_active ON hospitals(is_active);

-- ============================================================
-- INSERT 100 HOSPITALS (sampling frame)
-- Data ini disinkronkan dengan HOSPITALS array di src/lib/hospitals.ts
-- ============================================================

INSERT INTO hospitals (no_urut, nama_rs, kelas_rs, kepemilikan, strata, target_mga, provinsi, kota_kabupaten) VALUES
-- SUMATERA BARAT (11 RS: 5 kelas A, 4 kelas B, 2 kelas C)
(1, 'RS Jiwa Prof. Dr. HB Saanin', 'A', 'Publik', 'Publik_A', 30, 'Sumatera Barat', 'Kota Padang'),
(2, 'RSUP Dr. M. Djamil', 'A', 'Publik', 'Publik_A', 30, 'Sumatera Barat', 'Kota Padang'),
(11, 'RS Paru Sumatera Barat', 'B', 'Publik', 'Publik_B', 75, 'Sumatera Barat', 'Kab. Padang Pariaman'),
(12, 'RS Stroke Nasional', 'B', 'Publik', 'Publik_B', 75, 'Sumatera Barat', 'Kota Bukittinggi'),
(13, 'RS. Universitas Andalas', 'B', 'Publik', 'Publik_B', 75, 'Sumatera Barat', 'Kota Padang'),
(14, 'RSUD Dr. Achmad Mochtar', 'A', 'Publik', 'Publik_A', 30, 'Sumatera Barat', 'Kota Bukittinggi'),
(15, 'RSUD Mohammad Natsir', 'B', 'Publik', 'Publik_B', 75, 'Sumatera Barat', 'Kota Solok'),
(16, 'RSUD Pariaman', 'B', 'Publik', 'Publik_B', 75, 'Sumatera Barat', 'Kab. Padang Pariaman'),
(36, 'RSUD Arosuka Solok', 'C', 'Publik', 'Publik_C', 75, 'Sumatera Barat', 'Kab. Solok'),
(37, 'RSUD Dr Adnaan WD', 'C', 'Publik', 'Publik_C', 75, 'Sumatera Barat', 'Kota Payakumbuh'),

-- DKI JAKARTA (7 RS: 3 kelas A, 3 kelas B, 1 kelas C)
(3, 'RS Jantung dan Pembuluh Darah Harapan Kita', 'A', 'Publik', 'Publik_A', 30, 'DKI Jakarta', 'Jakarta Barat'),
(4, 'RSUD Tarakan', 'A', 'Publik', 'Publik_A', 30, 'DKI Jakarta', 'Jakarta Pusat'),
(17, 'RS Dharma Jaya', 'B', 'Publik', 'Publik_B', 75, 'DKI Jakarta', 'Jakarta Pusat'),
(18, 'RS Ketergantungan Obat', 'B', 'Publik', 'Publik_B', 75, 'DKI Jakarta', 'Jakarta Timur'),
(19, 'RS Ridwan Meuraksa', 'B', 'Publik', 'Publik_B', 75, 'DKI Jakarta', 'Jakarta Timur'),
(44, 'RS Antam Medika', 'C', 'Publik', 'Publik_C', 75, 'DKI Jakarta', 'Jakarta Timur'),
(84, 'RS Mediros', 'C', 'Swasta', 'Swasta_C', 75, 'DKI Jakarta', 'Jakarta Timur'),

-- JAWA BARAT (13 RS: 2 kelas A, 5 kelas B, 6 kelas C)
(5, 'RS Jiwa Provinsi Jawa Barat', 'A', 'Publik', 'Publik_A', 30, 'Jawa Barat', 'Kab. Bandung Barat'),
(6, 'RS Jiwa dr. H. Marzoeki Mahdi', 'A', 'Publik', 'Publik_A', 30, 'Jawa Barat', 'Kota Bogor'),
(20, 'RS Bhayangkara Tk II Sartika Asih', 'B', 'Publik', 'Publik_B', 75, 'Jawa Barat', 'Kota Bandung'),
(21, 'RS Lanud dr. M. Salamun', 'B', 'Publik', 'Publik_B', 75, 'Jawa Barat', 'Kota Bandung'),
(22, 'RS Universitas Indonesia', 'B', 'Publik', 'Publik_B', 75, 'Jawa Barat', 'Kab. Bogor'),
(23, 'RSUD R Syamsudin SH', 'B', 'Publik', 'Publik_B', 75, 'Jawa Barat', 'Kota Sukabumi'),
(24, 'RSUD Waled', 'B', 'Publik', 'Publik_B', 75, 'Jawa Barat', 'Kab. Cirebon'),
(45, 'RS Bhayangkara Brimob', 'C', 'Publik', 'Publik_C', 75, 'Jawa Barat', 'Kota Depok'),
(46, 'RSUD Jampang Kulon', 'C', 'Publik', 'Publik_C', 75, 'Jawa Barat', 'Kab. Sukabumi'),
(47, 'RSUD Majalengka', 'C', 'Publik', 'Publik_C', 75, 'Jawa Barat', 'Kab. Majalengka'),
(86, 'RS Amanda Cikarang Selatan', 'C', 'Swasta', 'Swasta_C', 75, 'Jawa Barat', 'Kab. Bekasi'),
(87, 'RS Bunda Margonda', 'C', 'Swasta', 'Swasta_C', 75, 'Jawa Barat', 'Kab. Bogor'),
(89, 'RS Mitra Kasih', 'C', 'Swasta', 'Swasta_C', 75, 'Jawa Barat', 'Kab. Bandung'),

-- JAWA TENGAH (11 RS: 2 kelas A, 5 kelas B, 4 kelas C)
(7, 'RS Jiwa Daerah Dr. Amino Gondohutomo', 'A', 'Publik', 'Publik_A', 30, 'Jawa Tengah', 'Kota Semarang'),
(8, 'RS Jiwa Daerah Dr. RM. Soedjarwadi', 'A', 'Publik', 'Publik_A', 30, 'Jawa Tengah', 'Kab. Klaten'),
(25, 'RSK GM Univ. Jenderal Soedirman', 'B', 'Publik', 'Publik_B', 75, 'Jawa Tengah', 'Kab. Banyumas'),
(26, 'RSUD Banyumas', 'B', 'Publik', 'Publik_B', 75, 'Jawa Tengah', 'Kab. Banyumas'),
(27, 'RSUD Dr. R.Soedjati Soemodiardjo', 'B', 'Publik', 'Publik_B', 75, 'Jawa Tengah', 'Kab. Grobogan'),
(28, 'RSUD RAA Soewondo Pati', 'B', 'Publik', 'Publik_B', 75, 'Jawa Tengah', 'Kab. Pati'),
(48, 'RSUD Bung Karno Kota Surakarta', 'C', 'Publik', 'Publik_C', 75, 'Jawa Tengah', 'Kota Surakarta'),
(49, 'RSUD Kab. Batang', 'C', 'Publik', 'Publik_C', 75, 'Jawa Tengah', 'Kab. Batang'),
(50, 'RSUD Kajen Kab. Pekalongan', 'C', 'Publik', 'Publik_C', 75, 'Jawa Tengah', 'Kab. Pekalongan'),
(51, 'RSUD Karanganyar', 'C', 'Publik', 'Publik_C', 75, 'Jawa Tengah', 'Kab. Karanganyar'),
(52, 'RSUD Kayen Pati', 'C', 'Publik', 'Publik_C', 75, 'Jawa Tengah', 'Kab. Pati'),

-- DI YOGYAKARTA (4 RS: 1 kelas A, 1 kelas B, 2 kelas C)
(9, 'RS Jiwa Grhasia', 'A', 'Publik', 'Publik_A', 30, 'DI Yogyakarta', 'Kab. Sleman'),
(29, 'RS GM UGM Prof. Soedomo', 'B', 'Publik', 'Publik_B', 75, 'DI Yogyakarta', 'Kota Yogyakarta'),
(54, 'RSUD Wonosari', 'C', 'Publik', 'Publik_C', 75, 'DI Yogyakarta', 'Kab. Gunungkidul'),
(95, 'RS Panti Rahayu Gunungkidul', 'C', 'Swasta', 'Swasta_C', 75, 'DI Yogyakarta', 'Kab. Gunungkidul'),

-- JAWA TIMUR (10 RS: 1 kelas A, 5 kelas B, 4 kelas C)
(10, 'RS Jiwa Dr. Radjiman Wediodiningrat Lawang', 'A', 'Publik', 'Publik_A', 30, 'Jawa Timur', 'Kab. Malang'),
(30, 'RS Haji Surabaya', 'B', 'Publik', 'Publik_B', 75, 'Jawa Timur', 'Kota Surabaya'),
(31, 'RS Universitas Airlangga', 'B', 'Publik', 'Publik_B', 75, 'Jawa Timur', 'Kota Surabaya'),
(32, 'RSUD Dr. R. Koesma Tuban', 'B', 'Publik', 'Publik_B', 75, 'Jawa Timur', 'Kab. Tuban'),
(33, 'RSUD Dr. Soegiri Lamongan', 'B', 'Publik', 'Publik_B', 75, 'Jawa Timur', 'Kab. Lamongan'),
(34, 'RSUD dr. Mohamad Soewandhie', 'B', 'Publik', 'Publik_B', 75, 'Jawa Timur', 'Kota Surabaya'),
(55, 'RS Semen Gresik', 'C', 'Publik', 'Publik_C', 75, 'Jawa Timur', 'Kab. Gresik'),
(56, 'RS Tk III Dr Soedono Madiun', 'C', 'Publik', 'Publik_C', 75, 'Jawa Timur', 'Kota Madiun'),
(57, 'RS Universitas Brawijaya Malang', 'C', 'Publik', 'Publik_C', 75, 'Jawa Timur', 'Kota Malang'),
(58, 'RSUD Bhakti Dharma Husada', 'C', 'Publik', 'Publik_C', 75, 'Jawa Timur', 'Kota Surabaya'),

-- BANTEN (5 RS: 1 kelas B, 4 kelas C)
(35, 'RSUD Kabupaten Tangerang', 'B', 'Publik', 'Publik_B', 75, 'Banten', 'Kab. Tangerang'),
(60, 'RS Daan Mogot', 'C', 'Publik', 'Publik_C', 75, 'Banten', 'Kota Tangerang'),
(98, 'RS Islam Sari Asih Ar-rahmah', 'C', 'Swasta', 'Swasta_C', 75, 'Banten', 'Kota Tangerang'),
(99, 'RSIA Mutiara Bunda Tangerang', 'C', 'Swasta', 'Swasta_C', 75, 'Banten', 'Kota Tangerang'),
(100, 'RSIA Vitalaya', 'C', 'Swasta', 'Swasta_C', 75, 'Banten', 'Kota Tangerang Selatan'),

-- SWASTA KELAS A/B (14 RS)
(61, 'RS Khusus Gigi dan Mulut Baiturrahmah', 'B', 'Swasta', 'Swasta_AB', 45, 'Sumatera Barat', 'Kota Padang'),
(62, 'RS MMC Jakarta', 'B', 'Swasta', 'Swasta_AB', 45, 'DKI Jakarta', 'Jakarta Selatan'),
(63, 'RS Mayapada Jakarta', 'B', 'Swasta', 'Swasta_AB', 45, 'DKI Jakarta', 'Jakarta Selatan'),
(64, 'RS Medistra', 'B', 'Swasta', 'Swasta_AB', 45, 'DKI Jakarta', 'Jakarta Selatan'),
(65, 'RS Siloam Asri', 'B', 'Swasta', 'Swasta_AB', 45, 'DKI Jakarta', 'Jakarta Selatan'),
(66, 'RS Eka Bekasi', 'B', 'Swasta', 'Swasta_AB', 45, 'Jawa Barat', 'Kab. Bekasi'),
(67, 'RS GM Pendidikan Unjani', 'B', 'Swasta', 'Swasta_AB', 45, 'Jawa Barat', 'Kota Cimahi'),
(68, 'RS Mitra Keluarga Cikarang', 'B', 'Swasta', 'Swasta_AB', 45, 'Jawa Barat', 'Kab. Bekasi'),
(69, 'RS Sumber Waras Cirebon', 'B', 'Swasta', 'Swasta_AB', 45, 'Jawa Barat', 'Kab. Cirebon'),
(70, 'RS Islam GM Sultan Agung', 'B', 'Swasta', 'Swasta_AB', 45, 'Jawa Tengah', 'Kota Semarang'),
(71, 'RS PKU Muhammadiyah Gamping', 'B', 'Swasta', 'Swasta_AB', 45, 'DI Yogyakarta', 'Kab. Sleman'),
(72, 'RS Islam Surabaya', 'B', 'Swasta', 'Swasta_AB', 45, 'Jawa Timur', 'Kota Surabaya'),
(73, 'RS Mitra Keluarga Waru Sidoarjo', 'B', 'Swasta', 'Swasta_AB', 45, 'Jawa Timur', 'Kab. Sidoarjo'),
(74, 'RS Eka', 'B', 'Swasta', 'Swasta_AB', 45, 'Banten', 'Kota Tangerang Selatan'),

-- SWASTA KELAS B & C +补充 SUMATERA BARAT RSIA (21 RS)
(75, 'RS Omni Tangerang', 'B', 'Swasta', 'Swasta_AB', 45, 'Banten', 'Kab. Tangerang'),
(76, 'RSIA Annisa Payakumbuh', 'C', 'Swasta', 'Swasta_C', 75, 'Sumatera Barat', 'Kota Payakumbuh'),
(77, 'RSIA Bunda Padang', 'C', 'Swasta', 'Swasta_C', 75, 'Sumatera Barat', 'Kota Padang'),
(78, 'RSIA Permata Bunda Solok', 'C', 'Swasta', 'Swasta_C', 75, 'Sumatera Barat', 'Kota Solok'),
(79, 'RSIA Sayang Ibu', 'C', 'Swasta', 'Swasta_C', 75, 'Sumatera Barat', 'Kab. Tanah Datar'),
(80, 'RSIA Siti Hawa', 'C', 'Swasta', 'Swasta_C', 75, 'Sumatera Barat', 'Kota Padang'),
(81, 'RSIA Sukma Bunda', 'C', 'Swasta', 'Swasta_C', 75, 'Sumatera Barat', 'Kota Payakumbuh'),
(82, 'RSU Aisyiyah Padang', 'C', 'Swasta', 'Swasta_C', 75, 'Sumatera Barat', 'Kota Padang'),
(83, 'RSU Citra Bunda Medical Center Padang', 'C', 'Swasta', 'Swasta_C', 75, 'Sumatera Barat', 'Kota Padang'),
(85, 'RSIA Andhika', 'C', 'Swasta', 'Swasta_C', 75, 'DKI Jakarta', 'Jakarta Selatan'),
(88, 'RS Jantung Diagram', 'C', 'Swasta', 'Swasta_C', 75, 'Jawa Barat', 'Kota Depok'),
(90, 'RS Santo Yusup', 'C', 'Swasta', 'Swasta_C', 75, 'Jawa Barat', 'Kota Bandung'),
(91, 'RSIA Bunda Suryatni', 'C', 'Swasta', 'Swasta_C', 75, 'Jawa Barat', 'Kab. Bogor'),
(92, 'RS PKU Muhammadiyah Gombong', 'C', 'Swasta', 'Swasta_C', 75, 'Jawa Tengah', 'Kab. Kebumen'),
(93, 'RS Sarila Husada Sragen', 'C', 'Swasta', 'Swasta_C', 75, 'Jawa Tengah', 'Kab. Sragen'),
(94, 'RSIA Kasih Ibu Tegal', 'C', 'Swasta', 'Swasta_C', 75, 'Jawa Tengah', 'Kota Tegal'),
(96, 'RS Islam Jombang', 'C', 'Swasta', 'Swasta_C', 75, 'Jawa Timur', 'Kab. Jombang'),
(97, 'RSIA Putri Surabaya', 'C', 'Swasta', 'Swasta_C', 75, 'Jawa Timur', 'Kota Surabaya'),
(59, 'RSUD Waluyo Jati Kraksaan', 'C', 'Publik', 'Publik_C', 75, 'Jawa Timur', 'Kab. Probolinggo'),
(53, 'RSUD Majenang', 'C', 'Publik', 'Publik_C', 75, 'Jawa Tengah', 'Kab. Cilacap'),
(38, 'RSUD Lubuk Basung', 'C', 'Publik', 'Publik_C', 75, 'Sumatera Barat', 'Kab. Lima Puluh Kota'),
(39, 'RSUD Padang Pariaman', 'C', 'Publik', 'Publik_C', 75, 'Sumatera Barat', 'Kab. Padang Pariaman'),
(40, 'RSUD Pasaman Barat', 'C', 'Publik', 'Publik_C', 75, 'Sumatera Barat', 'Kab. Pasaman Barat'),
(41, 'RSUD Prof Dr M.A Hanafiah', 'C', 'Publik', 'Publik_C', 75, 'Sumatera Barat', 'Kab. Tanah Datar'),
(42, 'RSUD Sawah Lunto', 'C', 'Publik', 'Publik_C', 75, 'Sumatera Barat', 'Kota Sawahlunto'),
(43, 'RSUD dr. Rasidin Padang', 'C', 'Publik', 'Publik_C', 75, 'Sumatera Barat', 'Kota Padang')
ON CONFLICT (no_urut) DO NOTHING;

-- Verify
SELECT COUNT(*) as total_hospitals, strata, COUNT(*) as count
FROM hospitals
GROUP BY strata
ORDER BY strata;
