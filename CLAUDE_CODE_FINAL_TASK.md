# TUGAS CLAUDE CODE — UPDATE HOSPITAL LIST
# Repo: Ardi2020/questionnaire-app

## SATU-SATUNYA YANG PERLU DILAKUKAN:

Cari file yang berisi `let eQ = [` atau `const eQ` atau variabel array berisi data RS.
Berdasarkan bundle analysis, variabelnya bernama `eQ` dan ada di salah satu file ini:
- `lib/hospitals.ts` 
- `lib/data/hospitals.ts`
- `app/components/SurveyWizard.tsx`
- atau file lain yang berisi `id:1,nama:"RS Jiwa Prof. Dr. HB Saanin"`

Jalankan dulu:
```bash
grep -r "RS Jiwa Prof. Dr. HB Saanin" --include="*.ts" --include="*.tsx" -l
```

Setelah menemukan file tersebut, **ganti seluruh array hospital** dengan array di bawah ini.
Pertahankan nama variabel yang sama (misal jika sebelumnya `const eQ`, tetap `const eQ`).

## ARRAY BARU (copy persis):
const HOSPITAL_LIST = [
  {id:1,nama:"RS Jiwa Prof. Dr. HB Saanin",kelas:"A",kepemilikan:"Publik",provinsi:"Sumatera Barat",kotaKab:"Kota Padang",strata:"Publik_A"},
  {id:2,nama:"RSUP Dr. M. Djamil",kelas:"A",kepemilikan:"Publik",provinsi:"Sumatera Barat",kotaKab:"Kota Padang",strata:"Publik_A"},
  {id:3,nama:"RS Jantung dan Pembuluh Darah Harapan Kita",kelas:"A",kepemilikan:"Publik",provinsi:"DKI Jakarta",kotaKab:"Jakarta Barat",strata:"Publik_A"},
  {id:4,nama:"RSUD Tarakan",kelas:"A",kepemilikan:"Publik",provinsi:"DKI Jakarta",kotaKab:"Jakarta Pusat",strata:"Publik_A"},
  {id:5,nama:"RS Jiwa Provinsi Jawa Barat",kelas:"A",kepemilikan:"Publik",provinsi:"Jawa Barat",kotaKab:"Kab. Bandung Barat",strata:"Publik_A"},
  {id:6,nama:"RS Jiwa dr. H. Marzoeki Mahdi",kelas:"A",kepemilikan:"Publik",provinsi:"Jawa Barat",kotaKab:"Kota Bogor",strata:"Publik_A"},
  {id:7,nama:"RS Jiwa Daerah Dr. Amino Gondohutomo",kelas:"A",kepemilikan:"Publik",provinsi:"Jawa Tengah",kotaKab:"Kota Semarang",strata:"Publik_A"},
  {id:8,nama:"RS Jiwa Daerah Dr. RM. Soedjarwadi",kelas:"A",kepemilikan:"Publik",provinsi:"Jawa Tengah",kotaKab:"Kab. Klaten",strata:"Publik_A"},
  {id:9,nama:"RS Jiwa Grhasia",kelas:"A",kepemilikan:"Publik",provinsi:"DI Yogyakarta",kotaKab:"Kab. Sleman",strata:"Publik_A"},
  {id:10,nama:"RS Jiwa Dr. Radjiman Wediodiningrat Lawang",kelas:"A",kepemilikan:"Publik",provinsi:"Jawa Timur",kotaKab:"Kab. Malang",strata:"Publik_A"},
  {id:11,nama:"RS Paru Sumatera Barat",kelas:"B",kepemilikan:"Publik",provinsi:"Sumatera Barat",kotaKab:"Kab. Padang Pariaman",strata:"Publik_B"},
  {id:12,nama:"RS Otak DR. Drs. M. Hatta Bukittinggi (RSOMH)",kelas:"A",kepemilikan:"Publik",provinsi:"Sumatera Barat",kotaKab:"Kota Bukittinggi",strata:"Publik_A"},
  {id:13,nama:"RS. Universitas Andalas",kelas:"B",kepemilikan:"Publik",provinsi:"Sumatera Barat",kotaKab:"Kota Padang",strata:"Publik_B"},
  {id:14,nama:"RSUD Dr. Achmad Mochtar Bukittinggi",kelas:"A",kepemilikan:"Publik",provinsi:"Sumatera Barat",kotaKab:"Kota Bukittinggi",strata:"Publik_A"},
  {id:15,nama:"RSUD Mohammad Natsir",kelas:"B",kepemilikan:"Publik",provinsi:"Sumatera Barat",kotaKab:"Kota Solok",strata:"Publik_B"},
  {id:16,nama:"RSUD Prof. H. Muhammad Yamin S.H.",kelas:"B",kepemilikan:"Publik",provinsi:"Sumatera Barat",kotaKab:"Kota Pariaman",strata:"Publik_B"},
  {id:17,nama:"RS Dharma Jaya",kelas:"B",kepemilikan:"Publik",provinsi:"DKI Jakarta",kotaKab:"Jakarta Pusat",strata:"Publik_B"},
  {id:18,nama:"RS Ketergantungan Obat",kelas:"B",kepemilikan:"Publik",provinsi:"DKI Jakarta",kotaKab:"Jakarta Timur",strata:"Publik_B"},
  {id:19,nama:"RS Ridwan Meuraksa",kelas:"B",kepemilikan:"Publik",provinsi:"DKI Jakarta",kotaKab:"Jakarta Timur",strata:"Publik_B"},
  {id:20,nama:"RS Bhayangkara Tk II Sartika Asih",kelas:"B",kepemilikan:"Publik",provinsi:"Jawa Barat",kotaKab:"Kota Bandung",strata:"Publik_B"},
  {id:21,nama:"RS Lanud dr. M. Salamun",kelas:"B",kepemilikan:"Publik",provinsi:"Jawa Barat",kotaKab:"Kota Bandung",strata:"Publik_B"},
  {id:22,nama:"RS Universitas Indonesia",kelas:"A",kepemilikan:"Publik",provinsi:"Jawa Barat",kotaKab:"Kota Depok",strata:"Publik_A"},
  {id:23,nama:"RSUD R Syamsudin SH",kelas:"B",kepemilikan:"Publik",provinsi:"Jawa Barat",kotaKab:"Kota Sukabumi",strata:"Publik_B"},
  {id:24,nama:"RSUD Waled",kelas:"B",kepemilikan:"Publik",provinsi:"Jawa Barat",kotaKab:"Kab. Cirebon",strata:"Publik_B"},
  {id:25,nama:"RSK GM Univ. Jenderal Soedirman",kelas:"B",kepemilikan:"Publik",provinsi:"Jawa Tengah",kotaKab:"Kab. Banyumas",strata:"Publik_B"},
  {id:26,nama:"RSUD Banyumas",kelas:"B",kepemilikan:"Publik",provinsi:"Jawa Tengah",kotaKab:"Kab. Banyumas",strata:"Publik_B"},
  {id:27,nama:"RSUD Dr. R.Soedjati Soemodiardjo",kelas:"B",kepemilikan:"Publik",provinsi:"Jawa Tengah",kotaKab:"Kab. Grobogan",strata:"Publik_B"},
  {id:28,nama:"RSUD RAA Soewondo Pati",kelas:"B",kepemilikan:"Publik",provinsi:"Jawa Tengah",kotaKab:"Kab. Pati",strata:"Publik_B"},
  {id:29,nama:"RS GM UGM Prof. Soedomo",kelas:"B",kepemilikan:"Publik",provinsi:"DI Yogyakarta",kotaKab:"Kota Yogyakarta",strata:"Publik_B"},
  {id:30,nama:"RS Haji Surabaya",kelas:"B",kepemilikan:"Publik",provinsi:"Jawa Timur",kotaKab:"Kota Surabaya",strata:"Publik_B"},
  {id:31,nama:"RS Universitas Airlangga",kelas:"B",kepemilikan:"Publik",provinsi:"Jawa Timur",kotaKab:"Kota Surabaya",strata:"Publik_B"},
  {id:32,nama:"RSUD Dr. R. Koesma Tuban",kelas:"B",kepemilikan:"Publik",provinsi:"Jawa Timur",kotaKab:"Kab. Tuban",strata:"Publik_B"},
  {id:33,nama:"RSUD Dr. Soegiri Lamongan",kelas:"B",kepemilikan:"Publik",provinsi:"Jawa Timur",kotaKab:"Kab. Lamongan",strata:"Publik_B"},
  {id:34,nama:"RSUD dr. Mohamad Soewandhie",kelas:"B",kepemilikan:"Publik",provinsi:"Jawa Timur",kotaKab:"Kota Surabaya",strata:"Publik_B"},
  {id:35,nama:"RSUD Kabupaten Tangerang",kelas:"B",kepemilikan:"Publik",provinsi:"Banten",kotaKab:"Kab. Tangerang",strata:"Publik_B"},
  {id:36,nama:"RSUD Arosuka Solok",kelas:"C",kepemilikan:"Publik",provinsi:"Sumatera Barat",kotaKab:"Kab. Solok",strata:"Publik_C"},
  {id:37,nama:"RSUD Dr Adnaan WD",kelas:"C",kepemilikan:"Publik",provinsi:"Sumatera Barat",kotaKab:"Kota Payakumbuh",strata:"Publik_C"},
  {id:38,nama:"RSUD Lubuk Basung",kelas:"C",kepemilikan:"Publik",provinsi:"Sumatera Barat",kotaKab:"Kab. Agam",strata:"Publik_C"},
  {id:39,nama:"RSUD Padang Pariaman",kelas:"C",kepemilikan:"Publik",provinsi:"Sumatera Barat",kotaKab:"Kab. Padang Pariaman",strata:"Publik_C"},
  {id:40,nama:"RSUD Pasaman Barat",kelas:"C",kepemilikan:"Publik",provinsi:"Sumatera Barat",kotaKab:"Kab. Pasaman Barat",strata:"Publik_C"},
  {id:41,nama:"RSUD Prof Dr M.A Hanafiah",kelas:"C",kepemilikan:"Publik",provinsi:"Sumatera Barat",kotaKab:"Kab. Tanah Datar",strata:"Publik_C"},
  {id:42,nama:"RSUD Sawah Lunto",kelas:"C",kepemilikan:"Publik",provinsi:"Sumatera Barat",kotaKab:"Kota Sawahlunto",strata:"Publik_C"},
  {id:43,nama:"RSUD dr. Rasidin Padang",kelas:"C",kepemilikan:"Publik",provinsi:"Sumatera Barat",kotaKab:"Kota Padang",strata:"Publik_C"},
  {id:44,nama:"RS Antam Medika",kelas:"C",kepemilikan:"Swasta",provinsi:"DKI Jakarta",kotaKab:"Jakarta Timur",strata:"Publik_C"},
  {id:45,nama:"RS Bhayangkara Brimob",kelas:"C",kepemilikan:"Publik",provinsi:"Jawa Barat",kotaKab:"Kota Depok",strata:"Publik_C"},
  {id:46,nama:"RSUD Jampang Kulon",kelas:"C",kepemilikan:"Publik",provinsi:"Jawa Barat",kotaKab:"Kab. Sukabumi",strata:"Publik_C"},
  {id:47,nama:"RSUD Majalengka",kelas:"B",kepemilikan:"Publik",provinsi:"Jawa Barat",kotaKab:"Kab. Majalengka",strata:"Publik_B"},
  {id:48,nama:"RSUD Bung Karno Kota Surakarta",kelas:"C",kepemilikan:"Publik",provinsi:"Jawa Tengah",kotaKab:"Kota Surakarta",strata:"Publik_C"},
  {id:49,nama:"RSUD Kab. Batang",kelas:"C",kepemilikan:"Publik",provinsi:"Jawa Tengah",kotaKab:"Kab. Batang",strata:"Publik_C"},
  {id:50,nama:"RSUD Kajen Kab. Pekalongan",kelas:"C",kepemilikan:"Publik",provinsi:"Jawa Tengah",kotaKab:"Kab. Pekalongan",strata:"Publik_C"},
  {id:51,nama:"RSUD Karanganyar",kelas:"C",kepemilikan:"Publik",provinsi:"Jawa Tengah",kotaKab:"Kab. Karanganyar",strata:"Publik_C"},
  {id:52,nama:"RSUD Kayen Pati",kelas:"C",kepemilikan:"Publik",provinsi:"Jawa Tengah",kotaKab:"Kab. Pati",strata:"Publik_C"},
  {id:53,nama:"RSUD Majenang",kelas:"C",kepemilikan:"Publik",provinsi:"Jawa Tengah",kotaKab:"Kab. Cilacap",strata:"Publik_C"},
  {id:54,nama:"RSUD Wonosari",kelas:"B",kepemilikan:"Publik",provinsi:"DI Yogyakarta",kotaKab:"Kab. Gunungkidul",strata:"Publik_B"},
  {id:55,nama:"RS Semen Gresik",kelas:"B",kepemilikan:"Publik",provinsi:"Jawa Timur",kotaKab:"Kab. Gresik",strata:"Publik_B"},
  {id:56,nama:"RSUD Ngudi Waluyo Wlingi",kelas:"C",kepemilikan:"Publik",provinsi:"Jawa Timur",kotaKab:"Kab. Blitar",strata:"Publik_C"},
  {id:57,nama:"RS Universitas Brawijaya Malang",kelas:"C",kepemilikan:"Publik",provinsi:"Jawa Timur",kotaKab:"Kota Malang",strata:"Publik_C"},
  {id:58,nama:"RSUD Bhakti Dharma Husada",kelas:"B",kepemilikan:"Publik",provinsi:"Jawa Timur",kotaKab:"Kota Surabaya",strata:"Publik_B"},
  {id:59,nama:"RSUD Waluyo Jati Kraksaan",kelas:"B",kepemilikan:"Publik",provinsi:"Jawa Timur",kotaKab:"Kab. Probolinggo",strata:"Publik_B"},
  {id:60,nama:"RSUD Malingping",kelas:"C",kepemilikan:"Publik",provinsi:"Banten",kotaKab:"Kab. Lebak",strata:"Publik_C"},
  {id:61,nama:"RS Khusus Gigi dan Mulut Baiturrahmah",kelas:"B",kepemilikan:"Swasta",provinsi:"Sumatera Barat",kotaKab:"Kota Padang",strata:"Swasta_AB"},
  {id:62,nama:"RS MMC Jakarta",kelas:"B",kepemilikan:"Swasta",provinsi:"DKI Jakarta",kotaKab:"Jakarta Selatan",strata:"Swasta_AB"},
  {id:63,nama:"RS Mayapada Jakarta",kelas:"B",kepemilikan:"Swasta",provinsi:"DKI Jakarta",kotaKab:"Jakarta Selatan",strata:"Swasta_AB"},
  {id:64,nama:"RS Medistra",kelas:"B",kepemilikan:"Swasta",provinsi:"DKI Jakarta",kotaKab:"Jakarta Selatan",strata:"Swasta_AB"},
  {id:65,nama:"RS Siloam Asri",kelas:"B",kepemilikan:"Swasta",provinsi:"DKI Jakarta",kotaKab:"Jakarta Selatan",strata:"Swasta_AB"},
  {id:66,nama:"RS Eka Bekasi",kelas:"B",kepemilikan:"Swasta",provinsi:"Jawa Barat",kotaKab:"Kab. Bekasi",strata:"Swasta_AB"},
  {id:67,nama:"RS GM Pendidikan Unjani",kelas:"B",kepemilikan:"Swasta",provinsi:"Jawa Barat",kotaKab:"Kota Cimahi",strata:"Swasta_AB"},
  {id:68,nama:"RS Mitra Keluarga Cikarang",kelas:"B",kepemilikan:"Swasta",provinsi:"Jawa Barat",kotaKab:"Kab. Bekasi",strata:"Swasta_AB"},
  {id:69,nama:"RS Sumber Waras Cirebon",kelas:"B",kepemilikan:"Swasta",provinsi:"Jawa Barat",kotaKab:"Kab. Cirebon",strata:"Swasta_AB"},
  {id:70,nama:"RS Islam GM Sultan Agung",kelas:"B",kepemilikan:"Swasta",provinsi:"Jawa Tengah",kotaKab:"Kota Semarang",strata:"Swasta_AB"},
  {id:71,nama:"RS PKU Muhammadiyah Gamping",kelas:"B",kepemilikan:"Swasta",provinsi:"DI Yogyakarta",kotaKab:"Kab. Sleman",strata:"Swasta_AB"},
  {id:72,nama:"RS Islam Surabaya",kelas:"B",kepemilikan:"Swasta",provinsi:"Jawa Timur",kotaKab:"Kota Surabaya",strata:"Swasta_AB"},
  {id:73,nama:"RS Mitra Keluarga Waru Sidoarjo",kelas:"B",kepemilikan:"Swasta",provinsi:"Jawa Timur",kotaKab:"Kab. Sidoarjo",strata:"Swasta_AB"},
  {id:74,nama:"RS Eka",kelas:"B",kepemilikan:"Swasta",provinsi:"Banten",kotaKab:"Kota Tangerang Selatan",strata:"Swasta_AB"},
  {id:75,nama:"RS EMC Tangerang",kelas:"B",kepemilikan:"Swasta",provinsi:"Banten",kotaKab:"Kab. Tangerang",strata:"Swasta_AB"},
  {id:76,nama:"RSIA Annisa Payakumbuh",kelas:"C",kepemilikan:"Swasta",provinsi:"Sumatera Barat",kotaKab:"Kota Payakumbuh",strata:"Swasta_C"},
  {id:77,nama:"RSIA Bunda Padang",kelas:"C",kepemilikan:"Swasta",provinsi:"Sumatera Barat",kotaKab:"Kota Padang",strata:"Swasta_C"},
  {id:78,nama:"RSIA Permata Bunda Solok",kelas:"C",kepemilikan:"Swasta",provinsi:"Sumatera Barat",kotaKab:"Kota Solok",strata:"Swasta_C"},
  {id:79,nama:"RSIA Sayang Ibu",kelas:"C",kepemilikan:"Swasta",provinsi:"Sumatera Barat",kotaKab:"Kab. Tanah Datar",strata:"Swasta_C"},
  {id:80,nama:"RSIA Siti Hawa",kelas:"C",kepemilikan:"Swasta",provinsi:"Sumatera Barat",kotaKab:"Kota Padang",strata:"Swasta_C"},
  {id:81,nama:"RSIA Sukma Bunda",kelas:"C",kepemilikan:"Swasta",provinsi:"Sumatera Barat",kotaKab:"Kota Payakumbuh",strata:"Swasta_C"},
  {id:82,nama:"RSU Aisyiyah Padang",kelas:"C",kepemilikan:"Swasta",provinsi:"Sumatera Barat",kotaKab:"Kota Padang",strata:"Swasta_C"},
  {id:83,nama:"RSU Citra Bunda Medical Center Padang",kelas:"C",kepemilikan:"Swasta",provinsi:"Sumatera Barat",kotaKab:"Kota Padang",strata:"Swasta_C"},
  {id:84,nama:"RS Mediros",kelas:"C",kepemilikan:"Swasta",provinsi:"DKI Jakarta",kotaKab:"Jakarta Timur",strata:"Swasta_C"},
  {id:85,nama:"RSU Andhika",kelas:"C",kepemilikan:"Swasta",provinsi:"DKI Jakarta",kotaKab:"Jakarta Selatan",strata:"Swasta_C"},
  {id:86,nama:"RS Amanda Cikarang Selatan",kelas:"C",kepemilikan:"Swasta",provinsi:"Jawa Barat",kotaKab:"Kab. Bekasi",strata:"Swasta_C"},
  {id:87,nama:"RS Bunda Margonda",kelas:"C",kepemilikan:"Swasta",provinsi:"Jawa Barat",kotaKab:"Kota Depok",strata:"Swasta_C"},
  {id:88,nama:"Siloam Heart Hospital Cinere",kelas:"B",kepemilikan:"Swasta",provinsi:"Jawa Barat",kotaKab:"Kota Depok",strata:"Swasta_AB"},
  {id:89,nama:"RS Mitra Kasih",kelas:"C",kepemilikan:"Swasta",provinsi:"Jawa Barat",kotaKab:"Kota Cimahi",strata:"Swasta_C"},
  {id:90,nama:"RS Santo Yusup",kelas:"C",kepemilikan:"Swasta",provinsi:"Jawa Barat",kotaKab:"Kota Bandung",strata:"Swasta_C"},
  {id:91,nama:"RSIA Bunda Suryatni",kelas:"C",kepemilikan:"Swasta",provinsi:"Jawa Barat",kotaKab:"Kab. Bogor",strata:"Swasta_C"},
  {id:92,nama:"RS PKU Muhammadiyah Gombong",kelas:"B",kepemilikan:"Swasta",provinsi:"Jawa Tengah",kotaKab:"Kab. Kebumen",strata:"Swasta_AB"},
  {id:93,nama:"RS Sarila Husada Sragen",kelas:"C",kepemilikan:"Swasta",provinsi:"Jawa Tengah",kotaKab:"Kab. Sragen",strata:"Swasta_C"},
  {id:94,nama:"RSIA Kasih Ibu Tegal",kelas:"C",kepemilikan:"Swasta",provinsi:"Jawa Tengah",kotaKab:"Kota Tegal",strata:"Swasta_C"},
  {id:95,nama:"RS Panti Rahayu Gunungkidul",kelas:"C",kepemilikan:"Swasta",provinsi:"DI Yogyakarta",kotaKab:"Kab. Gunungkidul",strata:"Swasta_C"},
  {id:96,nama:"RSI Ibnu Sina Padang Panjang",kelas:"C",kepemilikan:"Swasta",provinsi:"Sumatera Barat",kotaKab:"Kota Padang Panjang",strata:"Swasta_C"},
  {id:97,nama:"RSIA Putri Surabaya",kelas:"C",kepemilikan:"Swasta",provinsi:"Jawa Timur",kotaKab:"Kota Surabaya",strata:"Swasta_C"},
  {id:98,nama:"RS Islam Sari Asih Ar-rahmah",kelas:"C",kepemilikan:"Swasta",provinsi:"Banten",kotaKab:"Kota Tangerang",strata:"Swasta_C"},
  {id:99,nama:"RSIA Mutiara Bunda Tangerang",kelas:"C",kepemilikan:"Swasta",provinsi:"Banten",kotaKab:"Kota Tangerang",strata:"Swasta_C"},
  {id:100,nama:"RSIA Vitalaya",kelas:"C",kepemilikan:"Swasta",provinsi:"Banten",kotaKab:"Kota Tangerang Selatan",strata:"Swasta_C"}
];

// Total: 100 RS
// Updated: 22 Maret 2026
// Changes: 3 RS replaced (56,60,96), 10 RS kelas updated, multiple name/location corrections

## SETELAH GANTI:
```bash
git add -A
git commit -m "fix: update hospital list - replace 3 invalid RS, update 10 RS kelas

Changes:
- No.12: RS Stroke Nasional → RS Otak DR. Drs. M. Hatta Bukittinggi (naik A)
- No.14: RSUD Dr. Achmad Mochtar → kelas A (naik dari B, Juni 2025)  
- No.16: RSUD Pariaman → RSUD Prof. H. Muhammad Yamin S.H., Kota Pariaman
- No.22: RS Universitas Indonesia → kelas A, lokasi Kota Depok
- No.38: RSUD Lubuk Basung → lokasi Kab. Agam (koreksi)
- No.44: RS Antam Medika → kepemilikan Swasta (koreksi)
- No.47: RSUD Majalengka → kelas B (naik 2024)
- No.54: RSUD Wonosari → kelas B (naik 2024/2025)
- No.55: RS Semen Gresik → kelas B (naik 2024-2025)
- No.56: REPLACE RS Tk III Dr Soedono Madiun → RSUD Ngudi Waluyo Wlingi
- No.58: RSUD Bhakti Dharma Husada → kelas B
- No.59: RSUD Waluyo Jati Kraksaan → kelas B
- No.60: REPLACE RS Daan Mogot → RSUD Malingping, Kab. Lebak
- No.75: RS Omni Tangerang → RS EMC Tangerang (rebranding)
- No.85: RSIA Andhika → RSU Andhika
- No.87: RS Bunda Margonda → lokasi Kota Depok
- No.88: RS Jantung Diagram → Siloam Heart Hospital Cinere (naik B)
- No.89: RS Mitra Kasih → lokasi Kota Cimahi
- No.92: RS PKU Muhammadiyah Gombong → kelas B (naik ~2024)
- No.96: REPLACE RS Islam Jombang → RSI Ibnu Sina Padang Panjang"

git push origin master
```

Vercel akan auto-deploy setelah push.
