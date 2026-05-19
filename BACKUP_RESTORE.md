# Backup & Restore — questionnaire-app

Tanggal dibuat: **2026-05-19**
Patuhi: **Locked Constraint #8** (data responden sacrosanct — tidak boleh hard delete).

---

## Apa yang ditambah

| File | Status | Fungsi |
|------|--------|--------|
| `migrations/001_audit_log.sql` | Baru | Tabel audit_log + index |
| `src/lib/backup-utils.ts` | Baru | Helper introspeksi schema, CSV parser/writer, auth check |
| `src/app/api/admin/export/route.ts` | Baru | GET endpoint download backup (JSON / CSV ZIP) |
| `src/app/api/admin/import/route.ts` | Baru | POST endpoint soft-restore (dry-run / apply) |
| `src/app/dashboard/backup/page.tsx` | Baru | UI lengkap |

**File existing tidak diubah** — semua additive.

---

## Setup (5 langkah, ~5 menit)

### 1. Install dependency baru

```powershell
cd C:\Users\asmul\Documents\Projects\Questionaire\questionnaire-app
npm install jszip
npm install -D @types/jszip
```

### 2. Jalankan migration di Neon Console

Buka Neon → SQL Editor → tempel isi file `migrations/001_audit_log.sql` → Run.

Verifikasi:
```sql
SELECT COUNT(*) FROM audit_log;   -- harus return 0
```

### 3. Test lokal (opsional tapi disarankan)

```powershell
npm run dev
```

Buka http://localhost:3000/dashboard/backup → klik **Download CSV ZIP**. File `backup-{timestamp}.zip` harus terdownload dengan isi: README.txt, _meta.json, responses.csv, hospitals.csv, audit_log.csv.

### 4. Commit & push

```powershell
git add migrations/ src/lib/backup-utils.ts src/app/api/admin src/app/dashboard/backup BACKUP_RESTORE.md
git commit -m "feat: admin backup/restore dengan soft-merge + audit_log"
git push
```

Vercel auto-deploy ~1-2 menit.

### 5. Pakai di production

```
https://questionnaire-app-ashy.vercel.app/dashboard/backup
```

Login pakai password `Arsanka01` (cookie auth dari `/dashboard/login` — sama seperti dashboard utama).

---

## Cara Pakai (workflow Pak Ardi)

### A. Backup mingguan (rutin)

1. Setiap Sabtu pagi, buka `/dashboard/backup`
2. Klik **Download CSV ZIP** + **Download JSON**
3. Simpan ke `04_Data_Collection/backup/2026MMDD/`

### B. Edit data manual di Excel → restore

1. Download CSV ZIP, ekstrak, buka `responses.csv` di Excel
2. Edit field yang perlu. **Untuk "menghapus" responden**: set `excluded = true` (locked constraint #8 — jangan hapus baris)
3. Save as CSV UTF-8
4. Di `/dashboard/backup`: upload CSV → isi "Nama tabel" = `responses` → klik **Preview Perubahan**
5. Review tabel ringkasan: insert / update / unchanged / skip
6. Jika OK, klik **Commit Perubahan** → konfirmasi
7. Verifikasi di Neon: `SELECT * FROM audit_log ORDER BY ts DESC LIMIT 20;`

### C. Disaster recovery

Upload file JSON backup terakhir → preview → commit. Row yang sudah ada di DB **tidak akan dihapus** sekalipun tidak ada di file backup.

---

## Behavior matrix

| Skenario | Aksi sistem |
|----------|------------|
| Row di file, tidak di DB | INSERT |
| Row di file, ada di DB, field identik | Skip (counted as `unchanged`) |
| Row di file, ada di DB, ada field berbeda | UPDATE per-field; log setiap perubahan di audit_log |
| Row tidak di file, ada di DB | **Dibiarkan** (TIDAK dihapus) |
| Row dengan PK kosong/null | Skip (counted as `skipped_no_pk`) + warning |
| Tabel di file, tidak ada di DB | Skip + warning |
| Tabel `audit_log` | Di-blocklist (tidak di-restore) |
| Composite PK > 2 kolom | Tidak didukung saat ini |

---

## Audit log queries

```sql
-- Aktivitas 7 hari terakhir
SELECT ts, action, rows_affected, notes
FROM audit_log
WHERE ts > NOW() - INTERVAL '7 days'
ORDER BY ts DESC;

-- Field apa yang paling sering di-edit
SELECT table_name, field_name, COUNT(*)
FROM audit_log
WHERE action = 'soft_update'
GROUP BY 1, 2 ORDER BY 3 DESC;

-- Trace siapa download backup (via IP)
SELECT ts, meta->>'ip' AS ip, meta->>'user_agent' AS ua, rows_affected
FROM audit_log
WHERE action = 'export'
ORDER BY ts DESC LIMIT 50;

-- Rollback panduan: cari semua perubahan field tertentu untuk row tertentu
SELECT ts, action, field_name, old_value, new_value
FROM audit_log
WHERE table_name = 'responses' AND row_id = '<UUID>'
ORDER BY ts;
```

---

## Test plan (sebelum n ≥ 100)

1. **Download test**: CSV ZIP buka di Excel — semua kolom Likert (ti1-4 sampai read_g1) muncul utuh.
2. **Roundtrip test**: download JSON → upload JSON yang sama → dry-run → `total_changes = 0`.
3. **Edit test**: ubah `excluded` 1 row → upload CSV → preview tampil 1 update dengan diff → commit → audit_log ada entry `soft_update`.
4. **Insert test**: tambah 1 row UUID baru di CSV → preview tampil 1 insert.
5. **Anti-delete test**: backup, tambah 1 responden baru via kuesioner, upload backup lama → row baru **tetap ada** di DB.

---

## Troubleshooting

| Error | Solusi |
|-------|--------|
| `audit_log table does not exist` | Jalankan migration `001_audit_log.sql` di Neon |
| `Unauthorized` di /dashboard/backup | Login dulu di `/dashboard/login` |
| `Cannot find module 'jszip'` | `npm install jszip` lalu redeploy |
| Upload ZIP gagal parse | Pakai ZIP hasil dari endpoint export, bukan ZIP buatan Windows Explorer |
| Update palsu terdeteksi padahal data sama | Tipe data berbeda (number vs string). Comparator sudah handle ini lewat `eq()` di `backup-utils.ts`, tapi datetime harus ISO string. |
| `Unsafe identifier` error | Nama tabel/kolom mengandung karakter aneh. Skema kita seharusnya aman; lapor jika muncul. |

---

## Yang TIDAK dibangun (sengaja)

- Hard delete via UI (constraint #8)
- Restore tabel `hospitals` (constraint #9 — `kelas_rs` vs `kelas_terkini` lebih aman lewat migration manual)
- Versioning antar backup (cukup nama file timestamp)
- Multi-level permission (1 password sesuai permintaan)
- Composite PK > 2 kolom (tidak relevan untuk schema saat ini)
