# SPEC: Dashboard Data Management & Outlier Handling
# For: Claude Code execution
# Date: 10 Maret 2026
# Repo: ~/Documents/Projects/Questionaire/questionnaire-app

---

## CONTEXT

- **App:** questionnaire-app-ashy.vercel.app
- **Stack:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Database:** Neon Postgres (via Vercel Integration) — NOT Supabase
- **Connection:** Use `@neondatabase/serverless` or standard `pg` pool via `DATABASE_URL` env var
- **Dashboard:** `/dashboard` (protected, password from env `DASHBOARD_PASSWORD`)
- **Dashboard tabs:** "Monitoring" | "Analisis Data"
- **Current state:** 22 respondents, 4 detected outliers (2 straightline, 2 near-SL)
- **Auth pattern:** Cookie-based (`dashboard_auth`), check against `process.env.DASHBOARD_PASSWORD`

### IMPORTANT — Database is Neon, NOT Supabase
All database queries use raw SQL via Neon serverless driver or `pg` Pool.
Do NOT use Supabase client (`@supabase/supabase-js`). 
Check existing code in `src/app/api/dashboard/route.ts` and `src/app/api/submit/route.ts` to see the actual DB connection pattern used, and follow that same pattern for all new endpoints.

---

## OBJECTIVE

Add 5 features to the "Analisis Data" tab:

1. **Soft delete** (exclude/restore) for any respondent
2. **Filter by hospital** (dropdown + search autocomplete)  
3. **Enhanced outlier panel** with RS name, strata, profession per outlier
4. **Excluded responses panel** with restore capability
5. **All statistics auto-recalculate** excluding soft-deleted rows

---

## 1. DATABASE MIGRATION

Create file `neon-migration-v4.sql` in repo root:

```sql
-- Soft delete columns for data screening
ALTER TABLE responses ADD COLUMN IF NOT EXISTS excluded BOOLEAN DEFAULT false;
ALTER TABLE responses ADD COLUMN IF NOT EXISTS excluded_reason TEXT;
ALTER TABLE responses ADD COLUMN IF NOT EXISTS excluded_at TIMESTAMPTZ;

-- Index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_responses_excluded ON responses(excluded);

-- Backfill existing rows (ensure no NULLs)
UPDATE responses SET excluded = false WHERE excluded IS NULL;
```

**Execution:** Run this SQL in Neon Console (https://console.neon.tech) > SQL Editor after code is deployed.

---

## 2. API CHANGES

### 2.1 Helper: Database Connection Pattern

Before creating new endpoints, check the existing DB helper. It's likely in one of these locations:
- `src/lib/db.ts`
- `src/lib/neon.ts`  
- Or inline in `src/app/api/submit/route.ts`

Use the EXACT same connection pattern. Example (if using @neondatabase/serverless):
```typescript
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!);
```

Or if using pg Pool:
```typescript
import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```

**CRITICAL: Check existing code first. Do not guess the pattern.**

### 2.2 Helper: Auth Check Pattern

Check how existing dashboard endpoints verify auth. Likely pattern:
```typescript
import { cookies } from "next/headers";

async function checkDashboardAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const auth = cookieStore.get("dashboard_auth");
  return auth?.value === process.env.DASHBOARD_PASSWORD;
}
```

Or it might use middleware. **Check `src/middleware.ts` first.**

Use the SAME auth pattern in all new endpoints.

### 2.3 Helper: Strata Computation

Add this utility function (in `src/lib/utils.ts` or similar):

```typescript
export function computeStrata(jenisRS: string, kelasRS: string): string {
  const jenis = jenisRS?.includes('Publik') || jenisRS?.includes('Pemerintah') ? 'Publik' : 'Swasta';
  const kelas = kelasRS?.replace('Kelas ', '').trim() || '?';
  if (jenis === 'Swasta' && (kelas === 'A' || kelas === 'B')) return 'Swasta AB';
  return `${jenis} ${kelas}`;
}
```

---

### 2.4 Modify: `/api/dashboard/analytics/route.ts`

**Changes required:**

#### A) Filter excluded rows
ALL queries that count/aggregate response data must add:
```sql
WHERE (excluded = false OR excluded IS NULL)
```

This affects: n count, adequacy calculation, construct stats, item stats, missing data, outlier detection.

#### B) Accept query parameter `hospital_id`
```typescript
const { searchParams } = new URL(request.url);
const hospitalId = searchParams.get('hospital_id');

// Add to WHERE clause if present:
// AND hospital_id = $hospitalId
```

When `hospital_id` is provided, ALL statistics are scoped to that hospital only.

#### C) Enrich outlier details
Current outlier output only has: `{ id, type, detail }` with truncated ID.

Change to return FULL data per outlier:
```typescript
interface OutlierDetail {
  id: string;            // FULL UUID — not truncated
  type: string;          // "straightlining" | "near-straightlining" | "extreme-score"  
  detail: string;        // e.g. "Semua jawaban = 7"
  nama_rs: string;       // from responses.nama_rs column
  strata: string;        // computed via computeStrata(jenis_rs, kelas_rs)
  profesi: string;       // from responses.profesi column
  hospital_id: number | null;
}
```

To get this data: when iterating through rows for outlier detection, you already have the full row. Just include the extra fields.

#### D) Add excluded count to response
Add to the JSON response:
```typescript
{
  n: number,              // count of active (non-excluded) responses
  excludedCount: number,  // count of excluded responses
  // ... rest of existing fields
}
```

#### E) Add hospital list to response
Add a list of hospitals that have respondents (for the filter dropdown):
```typescript
{
  hospitalList: Array<{
    hospital_id: number;
    nama_rs: string;
    strata: string;
    response_count: number;
  }>;
}
```

Query:
```sql
SELECT hospital_id, nama_rs, jenis_rs, kelas_rs, COUNT(*) as response_count
FROM responses 
WHERE (excluded = false OR excluded IS NULL) AND hospital_id IS NOT NULL
GROUP BY hospital_id, nama_rs, jenis_rs, kelas_rs
ORDER BY nama_rs
```

---

### 2.5 New: `/api/dashboard/exclude/route.ts`

**POST** — Exclude (soft delete) one respondent:
```typescript
export async function POST(request: Request) {
  // 1. Check auth
  // 2. Parse body: { id: string, reason: string }
  // 3. Execute:
  //    UPDATE responses 
  //    SET excluded = true, excluded_reason = $reason, excluded_at = NOW() 
  //    WHERE id = $id AND (excluded = false OR excluded IS NULL)
  // 4. Return { success: true, id }
}
```

**DELETE** — Restore (un-exclude) one respondent:
```typescript
export async function DELETE(request: Request) {
  // 1. Check auth
  // 2. Parse body: { id: string }
  // 3. Execute:
  //    UPDATE responses 
  //    SET excluded = false, excluded_reason = NULL, excluded_at = NULL 
  //    WHERE id = $id AND excluded = true
  // 4. Return { success: true, id }
}
```

**Error handling:** Return 401 for auth failure, 404 if response not found, 400 for missing params.

---

### 2.6 New: `/api/dashboard/excluded/route.ts`

**GET** — List all excluded responses:
```typescript
export async function GET(request: Request) {
  // 1. Check auth
  // 2. Query:
  //    SELECT id, nama_rs, jenis_rs, kelas_rs, profesi, 
  //           excluded_reason, excluded_at,
  //           TI1, TI2, TI3, TI4, OS1, OS2, OS3, OS4,
  //           DC1, DC2, DC3, DC4, PEOU1, PEOU2, PEOU3, PEOU4,
  //           PU1, PU2, PU3, PU4, BI1, BI2, BI3,
  //           READ1, READ2, READ3, READ4, READ_G1
  //    FROM responses WHERE excluded = true
  //    ORDER BY excluded_at DESC
  // 3. For each row, compute:
  //    - strata via computeStrata()
  //    - mean_score = average of all 28 item values
  // 4. Return { excluded: [...] }
}
```

Response shape:
```typescript
{
  excluded: Array<{
    id: string;
    nama_rs: string;
    strata: string;
    profesi: string;
    excluded_reason: string;
    excluded_at: string;
    mean_score: number;  // average across all 28 items
  }>
}
```

---

### 2.7 Modify: `/api/dashboard/route.ts` (Monitoring tab)

Add `WHERE (excluded = false OR excluded IS NULL)` to ALL count queries.
This ensures: per-strata counts, per-RS counts, per-province counts all exclude soft-deleted rows.

---

### 2.8 Modify: `/api/dashboard/export/route.ts` (CSV Export)

1. Add columns `excluded`, `excluded_reason`, `excluded_at` to CSV output
2. Default behavior: export ONLY non-excluded rows (`WHERE excluded = false OR excluded IS NULL`)
3. Support query param `?include_excluded=true` to export ALL rows (excluded flagged in the columns)

---

## 3. FRONTEND CHANGES

### 3.1 Modify: `src/components/dashboard/analytics-panel.tsx`

This is the main file to modify. All changes below are in this component.

#### A) State additions

```typescript
// Hospital filter
const [hospitalFilter, setHospitalFilter] = useState<number | null>(null);
const [hospitalSearch, setHospitalSearch] = useState("");

// Excluded responses
const [excludedData, setExcludedData] = useState<ExcludedResponse[]>([]);
const [excludedLoading, setExcludedLoading] = useState(false);

// Action states
const [excluding, setExcluding] = useState<string | null>(null); // id being excluded
const [restoring, setRestoring] = useState<string | null>(null); // id being restored
```

#### B) Data fetching modifications

When fetching analytics, append hospital filter:
```typescript
const url = hospitalFilter 
  ? `/api/dashboard/analytics?hospital_id=${hospitalFilter}`
  : `/api/dashboard/analytics`;
```

Add separate fetch for excluded list:
```typescript
async function fetchExcluded() {
  setExcludedLoading(true);
  const res = await fetch("/api/dashboard/excluded");
  const data = await res.json();
  setExcludedData(data.excluded || []);
  setExcludedLoading(false);
}
```

Call both on mount and after any exclude/restore action.

#### C) Hospital filter UI — Top of panel

Place ABOVE the Sample Adequacy section:

```tsx
{/* Hospital Filter */}
<div className="bg-white rounded-xl border border-gray-200 p-4">
  <div className="flex items-center gap-3 flex-wrap">
    <span className="text-sm font-medium text-gray-600">Filter RS:</span>
    
    {/* Search input with autocomplete */}
    <div className="relative flex-1 max-w-xs">
      <input
        type="text"
        placeholder="Ketik nama rumah sakit..."
        value={hospitalSearch}
        onChange={(e) => setHospitalSearch(e.target.value)}
        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {/* Autocomplete dropdown — show when hospitalSearch.length > 1 */}
      {hospitalSearch.length > 1 && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {analyticsData.hospitalList
            .filter(h => h.nama_rs.toLowerCase().includes(hospitalSearch.toLowerCase()))
            .map(h => (
              <button
                key={h.hospital_id}
                onClick={() => {
                  setHospitalFilter(h.hospital_id);
                  setHospitalSearch("");
                }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 border-b border-gray-50"
              >
                <span className="font-medium">{h.nama_rs}</span>
                <span className="text-gray-400 ml-2">({h.strata}) · {h.response_count} responden</span>
              </button>
            ))
          }
        </div>
      )}
    </div>

    {/* Dropdown select */}
    <select
      value={hospitalFilter || ""}
      onChange={(e) => setHospitalFilter(e.target.value ? Number(e.target.value) : null)}
      className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white"
    >
      <option value="">Semua RS</option>
      {analyticsData.hospitalList?.map(h => (
        <option key={h.hospital_id} value={h.hospital_id}>
          {h.nama_rs} ({h.strata})
        </option>
      ))}
    </select>

    {/* Reset button — only show when filter active */}
    {hospitalFilter && (
      <button
        onClick={() => { setHospitalFilter(null); setHospitalSearch(""); }}
        className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
      >
        ✕ Reset Filter
      </button>
    )}
  </div>

  {/* Active filter badge */}
  {hospitalFilter && (
    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
      📍 {analyticsData.hospitalList?.find(h => h.hospital_id === hospitalFilter)?.nama_rs}
      ({analyticsData.hospitalList?.find(h => h.hospital_id === hospitalFilter)?.strata})
    </div>
  )}
</div>
```

#### D) Enhanced Outlier Panel

Replace current outlier rendering. Each row shows full context + Exclude button:

```tsx
{outliers.details.map((o) => (
  <div key={o.id} className="flex items-center gap-2 text-xs p-2.5 bg-gray-50 rounded border border-gray-100">
    {/* Type badge */}
    <span className={`shrink-0 px-1.5 py-0.5 rounded font-medium ${
      o.type === "straightlining" 
        ? "bg-red-100 text-red-700" 
        : o.type === "near-straightlining" 
          ? "bg-amber-100 text-amber-700" 
          : "bg-orange-100 text-orange-700"
    }`}>
      {o.type === "straightlining" ? "Straightline" : o.type === "near-straightlining" ? "Near-SL" : "Extreme"}
    </span>
    
    {/* Detail */}
    <span className="text-gray-600">{o.detail}</span>
    <span className="text-gray-300">|</span>
    
    {/* RS + Strata */}
    <span className="text-gray-700 font-medium truncate max-w-[200px]" title={o.nama_rs}>
      {o.nama_rs || "RS tidak diketahui"}
    </span>
    <span className="text-gray-400 shrink-0">({o.strata})</span>
    <span className="text-gray-300">|</span>
    
    {/* Profesi */}
    <span className="text-gray-500 shrink-0">{o.profesi || "-"}</span>
    
    {/* Spacer + Exclude button */}
    <span className="ml-auto" />
    <button
      onClick={() => handleExclude(o.id, `${o.type}: ${o.detail}`)}
      disabled={excluding === o.id}
      className="shrink-0 px-2.5 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 
                 transition-colors font-medium disabled:opacity-50"
    >
      {excluding === o.id ? "..." : "Exclude"}
    </button>
  </div>
))}
```

#### E) Exclude handler function

```typescript
async function handleExclude(id: string, reason: string) {
  const rsName = outliers.details.find(o => o.id === id)?.nama_rs || "Unknown";
  if (!confirm(`Exclude responden dari ${rsName}?\n\nAlasan: ${reason}\n\nData akan di-soft-delete (bisa di-restore).`)) return;
  
  setExcluding(id);
  try {
    const res = await fetch("/api/dashboard/exclude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, reason }),
    });
    if (!res.ok) throw new Error("Failed to exclude");
    
    // Re-fetch both analytics and excluded list
    await Promise.all([fetchAnalytics(), fetchExcluded()]);
  } catch (err) {
    alert("Gagal exclude responden. Coba lagi.");
  } finally {
    setExcluding(null);
  }
}
```

#### F) Restore handler function

```typescript
async function handleRestore(id: string) {
  if (!confirm("Kembalikan responden ini ke dataset aktif?")) return;
  
  setRestoring(id);
  try {
    const res = await fetch("/api/dashboard/exclude", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) throw new Error("Failed to restore");
    
    await Promise.all([fetchAnalytics(), fetchExcluded()]);
  } catch (err) {
    alert("Gagal restore responden. Coba lagi.");
  } finally {
    setRestoring(null);
  }
}
```

#### G) Excluded Responses Panel — NEW section

Place BELOW the Outlier Detection panel:

```tsx
{/* EXCLUDED RESPONSES PANEL */}
<div className="bg-white rounded-xl border border-gray-200 p-5">
  <div className="flex items-center justify-between mb-3">
    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
      Excluded Responses ({excludedData.length})
    </h3>
    {excludedData.length > 0 && (
      <span className="text-[10px] text-gray-400">
        Soft-deleted — bisa di-restore kapan saja
      </span>
    )}
  </div>
  
  {excludedLoading ? (
    <p className="text-sm text-gray-400">Loading...</p>
  ) : excludedData.length === 0 ? (
    <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
      <p className="text-sm text-gray-400">Belum ada responden yang di-exclude.</p>
    </div>
  ) : (
    <div className="space-y-1.5 max-h-60 overflow-y-auto">
      {excludedData.map((ex) => (
        <div key={ex.id} className="flex items-center gap-2 text-xs p-2.5 bg-red-50/50 rounded border border-red-100">
          <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-medium shrink-0">
            Excluded
          </span>
          <span className="text-gray-600 truncate">{ex.excluded_reason}</span>
          <span className="text-gray-300">|</span>
          <span className="text-gray-700 font-medium truncate max-w-[180px]">{ex.nama_rs || "-"}</span>
          <span className="text-gray-400 shrink-0">({ex.strata})</span>
          <span className="text-gray-300">|</span>
          <span className="text-gray-500 shrink-0">{ex.profesi || "-"}</span>
          <span className="ml-auto text-gray-300 text-[10px] shrink-0">
            {new Date(ex.excluded_at).toLocaleDateString('id-ID')}
          </span>
          <button
            onClick={() => handleRestore(ex.id)}
            disabled={restoring === ex.id}
            className="shrink-0 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded 
                       hover:bg-emerald-100 transition-colors font-medium disabled:opacity-50"
          >
            {restoring === ex.id ? "..." : "Restore"}
          </button>
        </div>
      ))}
    </div>
  )}
</div>
```

#### H) Sample Adequacy — Excluded count indicator

In the adequacy section, if `excludedCount > 0`, show additional info:

```tsx
{analyticsData.excludedCount > 0 && (
  <span className="text-xs text-gray-400 ml-2">
    ({analyticsData.excludedCount} responden di-exclude)
  </span>
)}
```

---

## 4. DATA FLOW DIAGRAM

```
┌─ User clicks "Exclude" on outlier ─────────────────────────────┐
│  → confirm dialog (shows RS name, strata, reason)              │
│  → POST /api/dashboard/exclude { id, reason }                  │
│  → Neon: UPDATE responses SET excluded=true, ...               │
│  → Frontend re-fetches:                                        │
│    1. /api/dashboard/analytics (stats without excluded)         │
│    2. /api/dashboard/excluded (excluded list)                   │
│  → Outlier disappears from active panel                        │
│  → Appears in Excluded Responses panel                         │
│  → All stats (n, adequacy, constructs) recalculate             │
│  → Monitoring tab also reflects change on next refresh         │
└────────────────────────────────────────────────────────────────┘

┌─ User clicks "Restore" on excluded response ───────────────────┐
│  → confirm dialog                                              │
│  → DELETE /api/dashboard/exclude { id }                        │
│  → Neon: UPDATE responses SET excluded=false, ...              │
│  → Frontend re-fetches both endpoints                          │
│  → Response reappears in active dataset                        │
│  → If still meets outlier criteria, reappears in outlier panel │
└────────────────────────────────────────────────────────────────┘

┌─ User selects hospital filter ─────────────────────────────────┐
│  → Re-fetch /api/dashboard/analytics?hospital_id=X             │
│  → ALL panels update: stats, items, outliers scoped to that RS │
│  → "Semua RS" resets to full dataset                           │
│  → Filter + exclude are independent operations                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 5. FILE CHECKLIST

| # | File | Action | Description |
|---|------|--------|-------------|
| 1 | `neon-migration-v4.sql` | **CREATE** | Add excluded, excluded_reason, excluded_at columns |
| 2 | `src/lib/utils.ts` (or existing util) | **MODIFY** | Add computeStrata() helper |
| 3 | `src/app/api/dashboard/analytics/route.ts` | **MODIFY** | Filter excluded, accept hospital_id, enrich outliers, add hospitalList |
| 4 | `src/app/api/dashboard/exclude/route.ts` | **CREATE** | POST to exclude, DELETE to restore |
| 5 | `src/app/api/dashboard/excluded/route.ts` | **CREATE** | GET list of excluded responses |
| 6 | `src/app/api/dashboard/route.ts` | **MODIFY** | Filter excluded rows in monitoring stats |
| 7 | `src/app/api/dashboard/export/route.ts` | **MODIFY** | Add excluded columns, support include_excluded param |
| 8 | `src/components/dashboard/analytics-panel.tsx` | **MODIFY** | Add RS filter, enhance outlier panel, add excluded panel |

---

## 6. CRITICAL IMPLEMENTATION NOTES

1. **Database is Neon Postgres** — Do NOT import or use `@supabase/supabase-js`. Check existing connection pattern first.

2. **Response ID must be FULL UUID** in outlier panel — not the truncated 8-char version. The exclude API needs the full ID to update the correct row.

3. **NULL handling for excluded column** — Existing 22 rows may have `excluded = NULL`. All WHERE clauses must use `(excluded = false OR excluded IS NULL)`, not just `excluded = false`.

4. **Filter RS and exclude are independent** — User can filter to RS M. Djamil while excluding an outlier from RS Hermina. The hospital filter only affects the display, not the exclude operation.

5. **CSV Export default** = only non-excluded. `?include_excluded=true` exports all with the excluded flag visible.

6. **Monitoring tab** must also respect excluded flag — all strata counts, RS counts, province counts should exclude soft-deleted rows.

7. **TypeScript** — Make sure all new types/interfaces are defined. Run `npx tsc --noEmit` before committing to ensure zero errors.

8. **Responsive design** — The outlier rows have many elements. Use `flex-wrap` or horizontal scroll on mobile. Test at narrow widths.

---

## 7. TESTING CHECKLIST

After deployment, verify:

- [ ] Outlier panel shows nama_rs, strata, profesi for each outlier
- [ ] Click "Exclude" on straightliner → confirm → outlier disappears from active list
- [ ] Excluded responden appears in "Excluded Responses" panel with date
- [ ] Sample Adequacy n decreases by 1 after exclude
- [ ] Construct stats recalculate (α, mean, SD change)
- [ ] Click "Restore" → responden returns to active dataset
- [ ] If still meets outlier criteria after restore, reappears in outlier panel
- [ ] Hospital filter dropdown: select RS → all data scopes to that RS
- [ ] Hospital search: type partial name → autocomplete shows matches → select → filter active
- [ ] Reset filter: click "Reset Filter" or select "Semua RS" → returns to full dataset
- [ ] CSV export: excluded column present, default export excludes soft-deleted
- [ ] CSV export with `?include_excluded=true`: all rows present, excluded ones flagged
- [ ] Monitoring tab: counts also reflect excluded state
- [ ] Run `npx tsc --noEmit` — zero TypeScript errors

---

## 8. DEPLOYMENT STEPS

```bash
# 1. In local repo
cd ~/Documents/Projects/Questionaire/questionnaire-app

# 2. Implement all changes above

# 3. TypeScript check
npx tsc --noEmit

# 4. Commit and push
git add -A
git commit -m "feat: data management - soft delete, RS filter, enhanced outlier panel

- Soft delete (exclude/restore) for outlier management
- Hospital filter (dropdown + search autocomplete) 
- Enhanced outlier panel with RS name, strata, profession
- Excluded responses panel with restore capability
- All stats auto-recalculate without excluded rows
- CSV export respects excluded flag
- Neon migration v4: excluded columns"

git push origin master

# 5. After Vercel auto-deploy, run SQL migration:
#    Go to https://console.neon.tech → SQL Editor
#    Paste and run contents of neon-migration-v4.sql

# 6. Test all features via dashboard
```
