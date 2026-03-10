# CLAUDE.md — Instruksi Otomatisasi untuk Claude Code
## Project: questionnaire-app (Migrasi Supabase → Neon Postgres)

> **Cara pakai:** Letakkan file ini di root folder project (`questionnaire-app/CLAUDE.md`),
> lalu jalankan `claude` di terminal dari folder tersebut.
> Claude Code akan membaca dan mengeksekusi semua instruksi ini secara otomatis.

---

## KONTEKS PROJECT

- **App:** Kuesioner penelitian disertasi BDA-AI Adoption di RS Indonesia
- **Framework:** Next.js 16 (App Router, TypeScript)
- **URL Production:** https://questionnaire-app-ashy.vercel.app
- **GitHub:** https://github.com/Ardi2020/questionnaire-app
- **Vercel Team:** ardi-muluks-projects
- **Vercel Project ID:** prj_zFnO9THm6XxNESyDlladOHvK43zn
- **Database lama:** Supabase (masalah: auto-pause setelah inaktif)
- **Database baru:** Neon Postgres via Vercel Storage (tidak pernah pause)

---

## TUGAS UTAMA: MIGRASI SUPABASE → NEON

Jalankan task ini secara berurutan. Jangan skip langkah apapun.

### TASK 1: Verifikasi kondisi awal

```bash
# Cek branch dan status git
git status
git branch
git log --oneline -5

# Cek apakah @neondatabase/serverless sudah ada
cat package.json | grep -E "neondatabase|supabase|vercel/postgres"

# Cek isi folder migration (tempat file hasil download)
ls -la migration/ 2>/dev/null || echo "Folder migration tidak ditemukan"
```

Jika folder `migration/` tidak ada, minta user untuk membuatnya dan menaruh `files.zip` di dalamnya sebelum lanjut.

---

### TASK 2: Extract dan copy file migration

```bash
# Masuk ke folder migration
cd migration

# Extract zip jika ada
unzip -o files.zip -d extracted/ 2>/dev/null || echo "Tidak ada zip, cek file langsung"

# Lihat isi extracted
ls -la extracted/ 2>/dev/null || ls -la .

# Kembali ke root project
cd ..
```

Setelah extract, copy file-file ke lokasi yang tepat:

```bash
# Tentukan source folder (bisa dari extracted/ atau langsung dari migration/)
SOURCE="migration/extracted"
[ ! -d "$SOURCE" ] && SOURCE="migration"

# Copy semua file ke lokasi yang benar
cp "$SOURCE/supabase.ts"        src/lib/supabase.ts
cp "$SOURCE/submit-route.ts"    src/app/api/submit/route.ts
cp "$SOURCE/dashboard-route.ts" src/app/api/dashboard/route.ts
cp "$SOURCE/export-route.ts"    src/app/api/dashboard/export/route.ts
cp "$SOURCE/reset-route.ts"     src/app/api/dashboard/reset/route.ts
cp "$SOURCE/analytics-route.ts" src/app/api/dashboard/analytics/route.ts

# Copy package.json jika ada (untuk update dependencies)
[ -f "$SOURCE/package.json" ] && cp "$SOURCE/package.json" package.json

echo "✅ Semua file berhasil di-copy"
```

---

### TASK 3: Verifikasi isi file yang di-copy

```bash
# Pastikan tidak ada lagi referensi Supabase lama
echo "=== Cek referensi Supabase lama ==="
grep -r "getSupabase\|createClient\|supabase-js\|@vercel/postgres" src/ && echo "⚠️  MASIH ADA referensi lama!" || echo "✅ Bersih - tidak ada referensi lama"

# Pastikan @neondatabase ada
echo "=== Cek import Neon ==="
grep -r "neondatabase\|getDb" src/lib/supabase.ts && echo "✅ Neon driver OK" || echo "⚠️  Driver Neon tidak ditemukan"

# Tampilkan isi supabase.ts baru
echo "=== Isi src/lib/supabase.ts ==="
cat src/lib/supabase.ts
```

Jika masih ada referensi lama, tulis ulang file `src/lib/supabase.ts` dengan konten berikut:

```typescript
// Migrated from Supabase → Neon Serverless Postgres
import { neon } from "@neondatabase/serverless";

export function getDb() {
  const url = process.env.POSTGRES_URL;
  if (!url) throw new Error("Missing POSTGRES_URL environment variable.");
  return neon(url);
}
```

---

### TASK 4: Install dependencies

```bash
# Install @neondatabase/serverless
npm install @neondatabase/serverless

# Hapus @vercel/postgres jika masih ada (deprecated)
npm uninstall @vercel/postgres 2>/dev/null || true

# Verifikasi
echo "=== Dependencies sekarang ==="
cat package.json | grep -E "neondatabase|supabase|vercel/postgres"
```

---

### TASK 5: Build test lokal (opsional tapi disarankan)

```bash
# Test build untuk pastikan tidak ada TypeScript error
npm run build 2>&1 | tail -30

# Jika error, tampilkan full error dan analisa penyebabnya
```

Jika build gagal, analisa error dan perbaiki sebelum lanjut ke deploy.

---

### TASK 6: Commit dan push ke GitHub

```bash
# Tambahkan semua perubahan
git add -A

# Lihat apa yang berubah
git diff --cached --stat

# Commit dengan pesan yang jelas
git commit -m "migrate: Supabase → Neon Serverless Postgres (@neondatabase/serverless)

- Replace Supabase client with Neon serverless driver
- No more auto-pause database issue
- Connects via POSTGRES_URL environment variable (set by Vercel)"

# Push ke GitHub (Vercel akan auto-deploy)
git push origin master
```

---

### TASK 7: Monitor deployment Vercel

Setelah push, tunggu 30 detik lalu cek status deployment:

```bash
# Cek deployment terbaru via Vercel CLI (jika terinstall)
vercel ls --prod 2>/dev/null || echo "Vercel CLI tidak terinstall, pantau di dashboard"
```

Jika Vercel CLI tidak tersedia, instruksikan user untuk pantau di:
`https://vercel.com/ardi-muluks-projects/questionnaire-app`

---

### TASK 8: Verifikasi app berjalan

```bash
# Test endpoint submit (POST)
curl -X POST https://questionnaire-app-ashy.vercel.app/api/submit \
  -H "Content-Type: application/json" \
  -d '{"test": true}' \
  2>/dev/null | head -c 200

# Jika response 400 (validation error) = API hidup
# Jika response 500 = Ada masalah koneksi DB
```

---

## TROUBLESHOOTING OTOMATIS

### Jika error "Cannot find module '@neondatabase/serverless'"
```bash
npm install @neondatabase/serverless --legacy-peer-deps
```

### Jika error "Missing POSTGRES_URL"
Artinya Neon database belum di-connect ke project Vercel.
Instruksikan user:
1. Buka https://vercel.com/ardi-muluks-projects/questionnaire-app
2. Klik tab **Storage**
3. Cari database `neon-lime-cave` → klik **Connect Project**
4. Pilih `questionnaire-app` → Connect
5. Redeploy

### Jika error TypeScript di analytics/route.ts
Cari dan ganti baris yang masih pakai `sql.query(...)`:
```bash
grep -n "sql\.query\|getSupabase" src/app/api/dashboard/analytics/route.ts
```
Lalu ganti dengan pattern `getDb()` dan template literal.

### Jika git push gagal (authentication)
```bash
# Cek remote URL
git remote -v

# Jika perlu token, gunakan HTTPS dengan token
# git remote set-url origin https://TOKEN@github.com/Ardi2020/questionnaire-app.git
```

---

## STRUKTUR FILE PENTING

```
questionnaire-app/
├── src/
│   ├── lib/
│   │   ├── supabase.ts          ← Diganti: Neon getDb()
│   │   ├── questions.ts         ← 28 item kuesioner
│   │   ├── hospitals.ts         ← 100 RS sampling frame
│   │   └── schemas.ts           ← Zod validation
│   └── app/
│       └── api/
│           ├── submit/route.ts              ← POST data responden
│           └── dashboard/
│               ├── route.ts                 ← GET dashboard stats
│               ├── analytics/route.ts       ← GET PLS-SEM analytics
│               ├── export/route.ts          ← GET CSV export
│               ├── login/route.ts           ← POST login dashboard
│               └── reset/route.ts           ← DELETE semua data
├── migration/
│   └── files.zip                ← File hasil download dari Claude
├── neon-schema.sql              ← Schema yang sudah dijalankan di Neon
└── CLAUDE.md                    ← File ini
```

---

## ENV VARIABLES YANG DIPERLUKAN

Vercel harus punya env vars berikut (otomatis di-inject saat Neon connected):

| Variable | Keterangan |
|---|---|
| `POSTGRES_URL` | Connection string Neon (pooled) |
| `POSTGRES_URL_NON_POOLING` | Connection string Neon (direct) |
| `DASHBOARD_PASSWORD` | Password login dashboard (sudah ada) |

Cek apakah sudah ada:
```bash
vercel env ls 2>/dev/null | grep -E "POSTGRES|DASHBOARD"
```

---

## SETELAH MIGRASI BERHASIL

✅ Kuesioner bisa diakses di: https://questionnaire-app-ashy.vercel.app  
✅ Dashboard di: https://questionnaire-app-ashy.vercel.app/dashboard  
✅ Database Neon tidak akan pernah auto-pause  
✅ Data tersimpan permanen selama periode pengumpulan data disertasi  

---

## CATATAN PENELITIAN

- **Target responden:** 300+ dari 100 RS sampling frame
- **Periode pengumpulan:** Wave 1 (pilot, n=30-50) → Wave 2 (main survey)
- **Database Neon:** `neon-lime-cave` (flat-forest-53366925)
- **Schema:** Tabel `responses` dengan 28 kolom item Likert 7-poin + 9 kolom profil
- **Backup data:** Gunakan fitur Export CSV di dashboard sebelum analisis PLS-SEM

---

*CLAUDE.md ini dibuat oleh Claude (claude.ai) untuk membantu otomatisasi
migrasi database kuesioner penelitian disertasi Asmuliardi Muluk,
Program Doktoral Teknik Industri, Universitas Andalas.*
