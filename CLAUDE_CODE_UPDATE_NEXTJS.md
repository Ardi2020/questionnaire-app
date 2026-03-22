# INSTRUKSI CLAUDE CODE — UPDATE KODE NEXT.JS
# Questionnaire App: Ganti hardcoded hospitals → query dari tabel `hospitals` di Neon

## KONTEKS
Database Neon sudah punya tabel `hospitals` berisi 100 RS lengkap (sudah diisi sebelumnya).
Tugas ini: ubah kode Next.js agar dropdown RS di form kuesioner + dashboard
mengambil data dari tabel `hospitals`, bukan dari hardcoded array.

Repo: https://github.com/Ardi2020/questionnaire-app
Database: Neon Postgres (env var: POSTGRES_URL atau DATABASE_URL)

---

## LANGKAH 1: Cek struktur repo

```bash
ls app/
ls app/kuesioner/
ls app/api/
ls lib/
```

Cari file yang berisi hardcoded list RS. Biasanya ada di:
- `app/kuesioner/page.tsx` — form utama
- `lib/hospitals.ts` atau `lib/data.ts`
- `app/api/submit/route.ts`

```bash
grep -r "RS Jiwa" --include="*.ts" --include="*.tsx" -l
grep -r "hospitalList\|HOSPITALS\|daftarRS" --include="*.ts" --include="*.tsx" -l
```

---

## LANGKAH 2: Buat API endpoint `/api/hospitals`

Buat file baru: `app/api/hospitals/route.ts`

```typescript
import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = neon(process.env.POSTGRES_URL!);
    
    const hospitals = await sql`
      SELECT 
        id,
        no_urut,
        nama_rs,
        kelas_rs,
        kelas_terkini,
        kepemilikan,
        strata,
        target_mga,
        provinsi,
        kota_kabupaten
      FROM hospitals
      WHERE is_active = true
      ORDER BY no_urut ASC
    `;
    
    return NextResponse.json({ success: true, data: hospitals });
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch hospitals' },
      { status: 500 }
    );
  }
}
```

---

## LANGKAH 3: Update form kuesioner (page.tsx)

Di file form kuesioner (biasanya `app/kuesioner/page.tsx`):

### 3A. Tambah state dan useEffect untuk fetch RS

```typescript
// Tambahkan di bagian atas komponen (setelah useState lain)
const [hospitalList, setHospitalList] = useState<Array<{
  id: number;
  no_urut: number;
  nama_rs: string;
  kelas_rs: string;
  kepemilikan: string;
  strata: string;
  provinsi: string;
  kota_kabupaten: string;
}>>([]);
const [loadingHospitals, setLoadingHospitals] = useState(true);

useEffect(() => {
  fetch('/api/hospitals')
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setHospitalList(data.data);
      }
    })
    .catch(err => console.error('Error loading hospitals:', err))
    .finally(() => setLoadingHospitals(false));
}, []);
```

### 3B. Update dropdown RS

Ganti hardcoded `<option>` dengan:

```tsx
{/* Dropdown Nama RS - dari database */}
<select 
  value={formData.hospital_id || ''} 
  onChange={(e) => {
    const selected = hospitalList.find(h => h.id === parseInt(e.target.value));
    setFormData(prev => ({
      ...prev,
      hospital_id: parseInt(e.target.value),
      nama_rs: selected?.nama_rs || '',
      jenis_rs: selected?.kepemilikan === 'Publik' 
        ? 'RS Pemerintah (Publik)' 
        : 'RS Swasta',
      kelas_rs: `Kelas ${selected?.kelas_terkini || selected?.kelas_rs}`,
      strata: selected?.strata || '',
      provinsi: selected?.provinsi || '',
    }));
  }}
  disabled={loadingHospitals}
>
  <option value="">
    {loadingHospitals ? 'Memuat daftar RS...' : '-- Pilih Rumah Sakit --'}
  </option>
  {hospitalList.map(h => (
    <option key={h.id} value={h.id}>
      {h.nama_rs} ({h.kota_kabupaten})
    </option>
  ))}
</select>
```

### 3C. Opsi alternatif: RS tidak terdaftar

Pastikan tetap ada opsi untuk RS di luar daftar (karena kuesioner mengizinkan ini):

```tsx
{/* Setelah dropdown, tambahkan checkbox/input untuk RS luar daftar */}
<div className="mt-2">
  <label className="text-sm text-gray-600">
    <input 
      type="checkbox" 
      checked={isOutsideList}
      onChange={(e) => setIsOutsideList(e.target.checked)}
      className="mr-2"
    />
    Rumah sakit saya tidak ada dalam daftar di atas
  </label>
</div>

{isOutsideList && (
  <input
    type="text"
    placeholder="Ketik nama rumah sakit Anda"
    value={formData.nama_rs}
    onChange={(e) => setFormData(prev => ({
      ...prev,
      hospital_id: null,
      nama_rs: e.target.value,
    }))}
    className="mt-2 w-full border rounded px-3 py-2"
  />
)}
```

---

## LANGKAH 4: Update dashboard filter RS

Di file dashboard (biasanya `app/dashboard/page.tsx` atau komponen terkait),
ganti hardcoded filter RS dengan data dari `/api/hospitals`:

```typescript
// Di komponen dashboard
const [hospitalOptions, setHospitalOptions] = useState<string[]>([]);

useEffect(() => {
  fetch('/api/hospitals')
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setHospitalOptions(data.data.map((h: any) => h.nama_rs));
      }
    });
}, []);
```

---

## LANGKAH 5: Commit dan push

```bash
git add app/api/hospitals/route.ts
git add app/kuesioner/page.tsx
git add app/dashboard/  # atau file dashboard yang diubah

git commit -m "feat: load hospital list from database (hospitals table)

- Add /api/hospitals endpoint querying Neon hospitals table
- Update kuesioner form to fetch RS dynamically from DB
- Remove hardcoded hospital arrays
- Keep option for non-listed hospitals (outside 100 target)
- Dashboard filter now uses DB hospital list

Database: hospitals table (100 RS aktif, is_active=true)
Includes 3 replacement hospitals and 10 updated class records"

git push origin master
# Vercel auto-deploy akan berjalan otomatis
```

---

## CATATAN PENTING

1. **Env var database**: Pastikan menggunakan env var yang sama dengan kode existing
   - Cek di `.env.local` atau `lib/db.ts` — bisa `POSTGRES_URL` atau `DATABASE_URL`
   - Kedua env var sudah ada di Vercel project settings

2. **Backward compatibility**: Data responses lama (dengan `hospital_id: null`) tetap valid
   - Form lama yang ketik manual nama RS menghasilkan `hospital_id: null` di responses
   - Ini sudah didesain demikian dari awal, tidak perlu diubah

3. **hospital_id mapping**: `hospitals.id` (SERIAL) berbeda dengan `hospitals.no_urut` (1-100)
   - Gunakan `id` sebagai foreign key jika perlu
   - `no_urut` adalah nomor urut penelitian (1-100)

4. **kelas yang ditampilkan di form**: Gunakan `kelas_terkini` (kelas aktual 2025/2026)
   bukan `kelas_rs` (kelas strata sampling) untuk akurasi data responden

---

*Dibuat: 22 Maret 2026 | Untuk repo: Ardi2020/questionnaire-app*
