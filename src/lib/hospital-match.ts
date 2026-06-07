// =============================================================
// Hospital name matcher
//
// Respondents can submit a free-text hospital name (manual entry in
// the survey's HospitalSelector) which leaves `hospital_id` NULL even
// when the hospital IS one of the active sampling-frame targets.
//
// This resolver maps such free-text `nama_rs` values back to an active
// hospital so the dashboard can attribute them correctly instead of
// dumping them all into "Responden dari RS Lainnya".
//
// Conservative by design: it only returns a match when it is confident
// (exact normalized token-set, or a UNIQUE high-overlap match). Ambiguous
// names (e.g. a bare city name that fits several hospitals) return null
// and stay in the "Lainnya" bucket.
// =============================================================

export interface MatchableHospital {
  id: number;
  nama_rs: string;
}

// Whole-word aliases for common abbreviations respondents type.
const ALIASES: [RegExp, string][] = [
  [/\bunand\b/g, "universitas andalas"],
  [/\brsko\b/g, "ketergantungan obat"],
  [/\brscm\b/g, "cipto mangunkusumo"],
  [/\brsmh\b/g, "mohammad hoesin"],
];

// Generic words that carry no identifying signal for an Indonesian hospital.
// NOTE: facility-type prefixes (rs/rsu/rsud/rsup/rsia/...) are dropped because
// respondents write them inconsistently (e.g. "RS X" for an official "RSUD X").
// But identifying qualifiers like "islam" are KEPT as tokens so distinct
// hospitals that share a city are not conflated — e.g. "RSUP Surabaya"
// ({surabaya}) must stay separate from "RS Islam Surabaya" ({islam, surabaya}).
const STOPWORDS = new Set([
  "rs", "rsu", "rsud", "rsup", "rsia", "rsk", "rsj", "rsi",
  "rumah", "sakit", "umum", "daerah", "pusat",
  "kota", "kab", "kabupaten", "provinsi", "prov",
  "dr", "drs", "prof", "h", "hj", "tk", "the", "dan", "of",
]);

export function normalizeHospitalName(input: string | null | undefined): string {
  let s = String(input ?? "").toLowerCase();
  s = s.replace(/\([^)]*\)/g, " "); // drop parentheticals e.g. "(RSOMH)"
  for (const [re, rep] of ALIASES) s = s.replace(re, rep);
  s = s.replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  return s;
}

export function hospitalTokens(input: string | null | undefined): Set<string> {
  return new Set(
    normalizeHospitalName(input)
      .split(" ")
      .filter((w) => w && !STOPWORDS.has(w)),
  );
}

function tokenKey(tokens: Set<string>): string {
  return Array.from(tokens).sort().join(" ");
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

export interface HospitalIndex {
  byKey: Map<string, number[]>; // token-key -> hospital ids (array = collision)
  entries: { id: number; tokens: Set<string> }[];
}

export function buildHospitalIndex(hospitals: MatchableHospital[]): HospitalIndex {
  const byKey = new Map<string, number[]>();
  const entries: { id: number; tokens: Set<string> }[] = [];
  for (const h of hospitals) {
    const tokens = hospitalTokens(h.nama_rs);
    if (tokens.size === 0) continue;
    const key = tokenKey(tokens);
    const arr = byKey.get(key) ?? [];
    arr.push(h.id);
    byKey.set(key, arr);
    entries.push({ id: h.id, tokens });
  }
  return { byKey, entries };
}

/**
 * Resolve a free-text hospital name to an active hospital id, or null.
 * MIN_SCORE / uniqueness guard keep ambiguous names out.
 */
export function resolveHospitalId(
  namaRS: string | null | undefined,
  index: HospitalIndex,
  minScore = 0.6,
): number | null {
  const tokens = hospitalTokens(namaRS);
  if (tokens.size === 0) return null;

  // 1) Exact normalized token-set match (order-independent).
  const exact = index.byKey.get(tokenKey(tokens));
  if (exact && exact.length === 1) return exact[0];
  if (exact && exact.length > 1) return null; // ambiguous duplicate names

  // 2) Best UNIQUE high-overlap match.
  let bestId: number | null = null;
  let best = 0;
  let secondBest = 0;
  for (const e of index.entries) {
    const s = jaccard(tokens, e.tokens);
    if (s > best) {
      secondBest = best;
      best = s;
      bestId = e.id;
    } else if (s > secondBest) {
      secondBest = s;
    }
  }
  if (bestId !== null && best >= minScore && best > secondBest) return bestId;

  // 3) Containment fallback: all typed tokens appear in exactly ONE hospital.
  // Handles official names with extra words respondents omit, e.g.
  // "RS Radjiman Wediodiningrat" → "RS Jiwa Dr. Radjiman Wediodiningrat Lawang".
  // Requires >=2 typed tokens + a unique superset to stay safe.
  if (tokens.size >= 2) {
    let containId: number | null = null;
    let containCount = 0;
    for (const e of index.entries) {
      let allIn = true;
      for (const t of tokens) {
        if (!e.tokens.has(t)) { allIn = false; break; }
      }
      if (allIn) {
        containCount++;
        containId = e.id;
        if (containCount > 1) break;
      }
    }
    if (containCount === 1) return containId;
  }
  return null;
}
