-- Migration V2: Add hospitals table, quota targets, and new response columns

-- 1. Hospitals reference table
CREATE TABLE IF NOT EXISTS hospitals (
  id SERIAL PRIMARY KEY,
  nama TEXT NOT NULL,
  kelas TEXT NOT NULL CHECK (kelas IN ('A', 'B', 'C')),
  kepemilikan TEXT NOT NULL CHECK (kepemilikan IN ('Publik', 'Swasta')),
  provinsi TEXT NOT NULL,
  kota_kab TEXT NOT NULL,
  strata TEXT NOT NULL,
  target_responden SMALLINT NOT NULL DEFAULT 3
);

ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read hospitals" ON hospitals FOR SELECT USING (true);
CREATE POLICY "Service role can manage hospitals" ON hospitals FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 2. Insert 100 RS terpilih
INSERT INTO hospitals (id, nama, kelas, kepemilikan, provinsi, kota_kab, strata) VALUES
  (1, 'RS Jiwa Prof. Dr. HB Saanin', 'A', 'Publik', 'Sumatera Barat', 'Kota Padang', 'Publik_A'),
  (2, 'RSUP Dr. M. Djamil', 'A', 'Publik', 'Sumatera Barat', 'Kota Padang', 'Publik_A'),
  (3, 'RS Jantung dan Pembuluh Darah Harapan Kita', 'A', 'Publik', 'DKI Jakarta', 'Jakarta Barat', 'Publik_A'),
  (4, 'RSUD Tarakan', 'A', 'Publik', 'DKI Jakarta', 'Jakarta Pusat', 'Publik_A'),
  (5, 'RS Jiwa Provinsi Jawa Barat', 'A', 'Publik', 'Jawa Barat', 'Kab. Bandung Barat', 'Publik_A'),
  (6, 'RS Jiwa dr. H. Marzoeki Mahdi', 'A', 'Publik', 'Jawa Barat', 'Kota Bogor', 'Publik_A'),
  (7, 'RS Jiwa Daerah Dr. Amino Gondohutomo', 'A', 'Publik', 'Jawa Tengah', 'Kota Semarang', 'Publik_A'),
  (8, 'RS Jiwa Daerah Dr. RM. Soedjarwadi', 'A', 'Publik', 'Jawa Tengah', 'Kab. Klaten', 'Publik_A'),
  (9, 'RS Jiwa Grhasia', 'A', 'Publik', 'DI Yogyakarta', 'Kab. Sleman', 'Publik_A'),
  (10, 'RS Jiwa Dr. Radjiman Wediodiningrat Lawang', 'A', 'Publik', 'Jawa Timur', 'Kab. Malang', 'Publik_A'),
  (11, 'RS Paru Sumatera Barat', 'B', 'Publik', 'Sumatera Barat', 'Kab. Padang Pariaman', 'Publik_B'),
  (12, 'RS Stroke Nasional', 'B', 'Publik', 'Sumatera Barat', 'Kota Bukittinggi', 'Publik_B'),
  (13, 'RS. Universitas Andalas', 'B', 'Publik', 'Sumatera Barat', 'Kota Padang', 'Publik_B'),
  (14, 'RSUD Dr. Achmad Mochtar', 'B', 'Publik', 'Sumatera Barat', 'Kota Bukittinggi', 'Publik_B'),
  (15, 'RSUD Mohammad Natsir', 'B', 'Publik', 'Sumatera Barat', 'Kota Solok', 'Publik_B'),
  (16, 'RSUD Pariaman', 'B', 'Publik', 'Sumatera Barat', 'Kab. Padang Pariaman', 'Publik_B'),
  (17, 'RS Dharma Jaya', 'B', 'Publik', 'DKI Jakarta', 'Jakarta Pusat', 'Publik_B'),
  (18, 'RS Ketergantungan Obat', 'B', 'Publik', 'DKI Jakarta', 'Jakarta Timur', 'Publik_B'),
  (19, 'RS Ridwan Meuraksa', 'B', 'Publik', 'DKI Jakarta', 'Jakarta Timur', 'Publik_B'),
  (20, 'RS Bhayangkara Tk II Sartika Asih', 'B', 'Publik', 'Jawa Barat', 'Kota Bandung', 'Publik_B'),
  (21, 'RS Lanud dr. M. Salamun', 'B', 'Publik', 'Jawa Barat', 'Kota Bandung', 'Publik_B'),
  (22, 'RS Universitas Indonesia', 'B', 'Publik', 'Jawa Barat', 'Kab. Bogor', 'Publik_B'),
  (23, 'RSUD R Syamsudin SH', 'B', 'Publik', 'Jawa Barat', 'Kota Sukabumi', 'Publik_B'),
  (24, 'RSUD Waled', 'B', 'Publik', 'Jawa Barat', 'Kab. Cirebon', 'Publik_B'),
  (25, 'RSK GM Univ. Jenderal Soedirman', 'B', 'Publik', 'Jawa Tengah', 'Kab. Banyumas', 'Publik_B'),
  (26, 'RSUD Banyumas', 'B', 'Publik', 'Jawa Tengah', 'Kab. Banyumas', 'Publik_B'),
  (27, 'RSUD Dr. R.Soedjati Soemodiardjo', 'B', 'Publik', 'Jawa Tengah', 'Kab. Grobogan', 'Publik_B'),
  (28, 'RSUD RAA Soewondo Pati', 'B', 'Publik', 'Jawa Tengah', 'Kab. Pati', 'Publik_B'),
  (29, 'RS GM UGM Prof. Soedomo', 'B', 'Publik', 'DI Yogyakarta', 'Kota Yogyakarta', 'Publik_B'),
  (30, 'RS Haji Surabaya', 'B', 'Publik', 'Jawa Timur', 'Kota Surabaya', 'Publik_B'),
  (31, 'RS Universitas Airlangga', 'B', 'Publik', 'Jawa Timur', 'Kota Surabaya', 'Publik_B'),
  (32, 'RSUD Dr. R. Koesma Tuban', 'B', 'Publik', 'Jawa Timur', 'Kab. Tuban', 'Publik_B'),
  (33, 'RSUD Dr. Soegiri Lamongan', 'B', 'Publik', 'Jawa Timur', 'Kab. Lamongan', 'Publik_B'),
  (34, 'RSUD dr. Mohamad Soewandhie', 'B', 'Publik', 'Jawa Timur', 'Kota Surabaya', 'Publik_B'),
  (35, 'RSUD Kabupaten Tangerang', 'B', 'Publik', 'Banten', 'Kab. Tangerang', 'Publik_B'),
  (36, 'RSUD Arosuka Solok', 'C', 'Publik', 'Sumatera Barat', 'Kab. Solok', 'Publik_C'),
  (37, 'RSUD Dr Adnaan WD', 'C', 'Publik', 'Sumatera Barat', 'Kota Payakumbuh', 'Publik_C'),
  (38, 'RSUD Lubuk Basung', 'C', 'Publik', 'Sumatera Barat', 'Kab. Lima Puluh Kota', 'Publik_C'),
  (39, 'RSUD Padang Pariaman', 'C', 'Publik', 'Sumatera Barat', 'Kab. Padang Pariaman', 'Publik_C'),
  (40, 'RSUD Pasaman Barat', 'C', 'Publik', 'Sumatera Barat', 'Kab. Pasaman Barat', 'Publik_C'),
  (41, 'RSUD Prof Dr M.A Hanafiah', 'C', 'Publik', 'Sumatera Barat', 'Kab. Tanah Datar', 'Publik_C'),
  (42, 'RSUD Sawah Lunto', 'C', 'Publik', 'Sumatera Barat', 'Kota Sawahlunto', 'Publik_C'),
  (43, 'RSUD dr. Rasidin Padang', 'C', 'Publik', 'Sumatera Barat', 'Kota Padang', 'Publik_C'),
  (44, 'RS Antam Medika', 'C', 'Publik', 'DKI Jakarta', 'Jakarta Timur', 'Publik_C'),
  (45, 'RS Bhayangkara Brimob', 'C', 'Publik', 'Jawa Barat', 'Kota Depok', 'Publik_C'),
  (46, 'RSUD Jampang Kulon', 'C', 'Publik', 'Jawa Barat', 'Kab. Sukabumi', 'Publik_C'),
  (47, 'RSUD Majalengka', 'C', 'Publik', 'Jawa Barat', 'Kab. Majalengka', 'Publik_C'),
  (48, 'RSUD Bung Karno Kota Surakarta', 'C', 'Publik', 'Jawa Tengah', 'Kota Surakarta', 'Publik_C'),
  (49, 'RSUD Kab. Batang', 'C', 'Publik', 'Jawa Tengah', 'Kab. Batang', 'Publik_C'),
  (50, 'RSUD Kajen Kab. Pekalongan', 'C', 'Publik', 'Jawa Tengah', 'Kab. Pekalongan', 'Publik_C'),
  (51, 'RSUD Karanganyar', 'C', 'Publik', 'Jawa Tengah', 'Kab. Karanganyar', 'Publik_C'),
  (52, 'RSUD Kayen Pati', 'C', 'Publik', 'Jawa Tengah', 'Kab. Pati', 'Publik_C'),
  (53, 'RSUD Majenang', 'C', 'Publik', 'Jawa Tengah', 'Kab. Cilacap', 'Publik_C'),
  (54, 'RSUD Wonosari', 'C', 'Publik', 'DI Yogyakarta', 'Kab. Gunungkidul', 'Publik_C'),
  (55, 'RS Semen Gresik', 'C', 'Publik', 'Jawa Timur', 'Kab. Gresik', 'Publik_C'),
  (56, 'RS Tk III Dr Soedono Madiun', 'C', 'Publik', 'Jawa Timur', 'Kota Madiun', 'Publik_C'),
  (57, 'RS Universitas Brawijaya Malang', 'C', 'Publik', 'Jawa Timur', 'Kota Malang', 'Publik_C'),
  (58, 'RSUD Bhakti Dharma Husada', 'C', 'Publik', 'Jawa Timur', 'Kota Surabaya', 'Publik_C'),
  (59, 'RSUD Waluyo Jati Kraksaan', 'C', 'Publik', 'Jawa Timur', 'Kab. Probolinggo', 'Publik_C'),
  (60, 'RS Daan Mogot', 'C', 'Publik', 'Banten', 'Kota Tangerang', 'Publik_C'),
  (61, 'RS Khusus Gigi dan Mulut Baiturrahmah', 'B', 'Swasta', 'Sumatera Barat', 'Kota Padang', 'Swasta_AB'),
  (62, 'RS MMC Jakarta', 'B', 'Swasta', 'DKI Jakarta', 'Jakarta Selatan', 'Swasta_AB'),
  (63, 'RS Mayapada Jakarta', 'B', 'Swasta', 'DKI Jakarta', 'Jakarta Selatan', 'Swasta_AB'),
  (64, 'RS Medistra', 'B', 'Swasta', 'DKI Jakarta', 'Jakarta Selatan', 'Swasta_AB'),
  (65, 'RS Siloam Asri', 'B', 'Swasta', 'DKI Jakarta', 'Jakarta Selatan', 'Swasta_AB'),
  (66, 'RS Eka Bekasi', 'B', 'Swasta', 'Jawa Barat', 'Kab. Bekasi', 'Swasta_AB'),
  (67, 'RS GM Pendidikan Unjani', 'B', 'Swasta', 'Jawa Barat', 'Kota Cimahi', 'Swasta_AB'),
  (68, 'RS Mitra Keluarga Cikarang', 'B', 'Swasta', 'Jawa Barat', 'Kab. Bekasi', 'Swasta_AB'),
  (69, 'RS Sumber Waras Cirebon', 'B', 'Swasta', 'Jawa Barat', 'Kab. Cirebon', 'Swasta_AB'),
  (70, 'RS Islam GM Sultan Agung', 'B', 'Swasta', 'Jawa Tengah', 'Kota Semarang', 'Swasta_AB'),
  (71, 'RS PKU Muhammadiyah Gamping', 'B', 'Swasta', 'DI Yogyakarta', 'Kab. Sleman', 'Swasta_AB'),
  (72, 'RS Islam Surabaya', 'B', 'Swasta', 'Jawa Timur', 'Kota Surabaya', 'Swasta_AB'),
  (73, 'RS Mitra Keluarga Waru Sidoarjo', 'B', 'Swasta', 'Jawa Timur', 'Kab. Sidoarjo', 'Swasta_AB'),
  (74, 'RS Eka', 'B', 'Swasta', 'Banten', 'Kota Tangerang Selatan', 'Swasta_AB'),
  (75, 'RS Omni Tangerang', 'B', 'Swasta', 'Banten', 'Kab. Tangerang', 'Swasta_AB'),
  (76, 'RSIA Annisa Payakumbuh', 'C', 'Swasta', 'Sumatera Barat', 'Kota Payakumbuh', 'Swasta_C'),
  (77, 'RSIA Bunda Padang', 'C', 'Swasta', 'Sumatera Barat', 'Kota Padang', 'Swasta_C'),
  (78, 'RSIA Permata Bunda Solok', 'C', 'Swasta', 'Sumatera Barat', 'Kota Solok', 'Swasta_C'),
  (79, 'RSIA Sayang Ibu', 'C', 'Swasta', 'Sumatera Barat', 'Kab. Tanah Datar', 'Swasta_C'),
  (80, 'RSIA Siti Hawa', 'C', 'Swasta', 'Sumatera Barat', 'Kota Padang', 'Swasta_C'),
  (81, 'RSIA Sukma Bunda', 'C', 'Swasta', 'Sumatera Barat', 'Kota Payakumbuh', 'Swasta_C'),
  (82, 'RSU Aisyiyah Padang', 'C', 'Swasta', 'Sumatera Barat', 'Kota Padang', 'Swasta_C'),
  (83, 'RSU Citra Bunda Medical Center Padang', 'C', 'Swasta', 'Sumatera Barat', 'Kota Padang', 'Swasta_C'),
  (84, 'RS Mediros', 'C', 'Swasta', 'DKI Jakarta', 'Jakarta Timur', 'Swasta_C'),
  (85, 'RSIA Andhika', 'C', 'Swasta', 'DKI Jakarta', 'Jakarta Selatan', 'Swasta_C'),
  (86, 'RS Amanda Cikarang Selatan', 'C', 'Swasta', 'Jawa Barat', 'Kab. Bekasi', 'Swasta_C'),
  (87, 'RS Bunda Margonda', 'C', 'Swasta', 'Jawa Barat', 'Kab. Bogor', 'Swasta_C'),
  (88, 'RS Jantung Diagram', 'C', 'Swasta', 'Jawa Barat', 'Kota Depok', 'Swasta_C'),
  (89, 'RS Mitra Kasih', 'C', 'Swasta', 'Jawa Barat', 'Kab. Bandung', 'Swasta_C'),
  (90, 'RS Santo Yusup', 'C', 'Swasta', 'Jawa Barat', 'Kota Bandung', 'Swasta_C'),
  (91, 'RSIA Bunda Suryatni', 'C', 'Swasta', 'Jawa Barat', 'Kab. Bogor', 'Swasta_C'),
  (92, 'RS PKU Muhammadiyah Gombong', 'C', 'Swasta', 'Jawa Tengah', 'Kab. Kebumen', 'Swasta_C'),
  (93, 'RS Sarila Husada Sragen', 'C', 'Swasta', 'Jawa Tengah', 'Kab. Sragen', 'Swasta_C'),
  (94, 'RSIA Kasih Ibu Tegal', 'C', 'Swasta', 'Jawa Tengah', 'Kota Tegal', 'Swasta_C'),
  (95, 'RS Panti Rahayu Gunungkidul', 'C', 'Swasta', 'DI Yogyakarta', 'Kab. Gunungkidul', 'Swasta_C'),
  (96, 'RS Islam Jombang', 'C', 'Swasta', 'Jawa Timur', 'Kab. Jombang', 'Swasta_C'),
  (97, 'RSIA Putri Surabaya', 'C', 'Swasta', 'Jawa Timur', 'Kota Surabaya', 'Swasta_C'),
  (98, 'RS Islam Sari Asih Ar-rahmah', 'C', 'Swasta', 'Banten', 'Kota Tangerang', 'Swasta_C'),
  (99, 'RSIA Mutiara Bunda Tangerang', 'C', 'Swasta', 'Banten', 'Kota Tangerang', 'Swasta_C'),
  (100, 'RSIA Vitalaya', 'C', 'Swasta', 'Banten', 'Kota Tangerang Selatan', 'Swasta_C');

-- 3. Quota targets table
CREATE TABLE IF NOT EXISTS quota_targets (
  id SERIAL PRIMARY KEY,
  strata TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  target_responden SMALLINT NOT NULL
);

ALTER TABLE quota_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read quota" ON quota_targets FOR SELECT USING (true);

INSERT INTO quota_targets (strata, label, target_responden) VALUES
  ('Publik_A',  'RS Publik Kelas A',     30),
  ('Publik_B',  'RS Publik Kelas B',     75),
  ('Publik_C',  'RS Publik Kelas C',     75),
  ('Swasta_AB', 'RS Swasta Kelas A & B', 45),
  ('Swasta_C',  'RS Swasta Kelas C',     75);

-- 4. Add new columns to responses
ALTER TABLE responses ADD COLUMN IF NOT EXISTS provinsi TEXT;
ALTER TABLE responses ADD COLUMN IF NOT EXISTS hospital_id INTEGER REFERENCES hospitals(id);
ALTER TABLE responses ADD COLUMN IF NOT EXISTS nama_rs TEXT;

CREATE INDEX IF NOT EXISTS idx_responses_hospital ON responses(hospital_id);
CREATE INDEX IF NOT EXISTS idx_responses_provinsi ON responses(provinsi);
