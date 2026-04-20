export interface Hospital {
  id: number;
  nama: string;
  kelas: "A" | "B" | "C";
  kepemilikan: "Publik" | "Swasta";
  provinsi: string;
  kotaKab: string;
  strata: string;
}

// Legacy static list — used by dashboard route (will be replaced by DB query in v2)
export const HOSPITALS: Hospital[] = [
  { id: 1, nama: "RS Jiwa Prof. Dr. HB Saanin", kelas: "A", kepemilikan: "Publik", provinsi: "Sumatera Barat", kotaKab: "Kota Padang", strata: "Publik_A" },
  { id: 2, nama: "RSUP Dr. M. Djamil", kelas: "A", kepemilikan: "Publik", provinsi: "Sumatera Barat", kotaKab: "Kota Padang", strata: "Publik_A" },
  { id: 3, nama: "RS Jantung dan Pembuluh Darah Harapan Kita", kelas: "A", kepemilikan: "Publik", provinsi: "DKI Jakarta", kotaKab: "Jakarta Barat", strata: "Publik_A" },
  { id: 4, nama: "RSUD Tarakan", kelas: "A", kepemilikan: "Publik", provinsi: "DKI Jakarta", kotaKab: "Jakarta Pusat", strata: "Publik_A" },
  { id: 5, nama: "RS Jiwa Provinsi Jawa Barat", kelas: "A", kepemilikan: "Publik", provinsi: "Jawa Barat", kotaKab: "Kab. Bandung Barat", strata: "Publik_A" },
];

/**
 * Get wilayah from provinsi name.
 * Covers all 38 Indonesian provinces.
 */
export function getWilayahFromProvinsi(provinsi: string): string {
  const sumatera = [
    "Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Kepulauan Riau",
    "Jambi", "Bengkulu", "Sumatera Selatan", "Kepulauan Bangka Belitung", "Lampung",
  ];
  const jawa = [
    "DKI Jakarta", "Jawa Barat", "Jawa Tengah", "DI Yogyakarta", "Jawa Timur", "Banten",
  ];
  const kalimantan = [
    "Kalimantan Barat", "Kalimantan Tengah", "Kalimantan Selatan",
    "Kalimantan Timur", "Kalimantan Utara",
  ];
  const sulawesi = [
    "Sulawesi Utara", "Sulawesi Tengah", "Sulawesi Selatan",
    "Sulawesi Tenggara", "Gorontalo", "Sulawesi Barat",
  ];
  const baliNusa = ["Bali", "Nusa Tenggara Barat", "Nusa Tenggara Timur"];
  const malukuPapua = [
    "Maluku", "Maluku Utara", "Papua", "Papua Barat",
    "Papua Pegunungan", "Papua Tengah", "Papua Selatan", "Papua Barat Daya",
  ];

  if (sumatera.includes(provinsi)) return "Sumatera";
  if (jawa.includes(provinsi)) return "Jawa";
  if (kalimantan.includes(provinsi)) return "Kalimantan";
  if (sulawesi.includes(provinsi)) return "Sulawesi";
  if (baliNusa.includes(provinsi)) return "Bali & Nusa Tenggara";
  if (malukuPapua.includes(provinsi)) return "Maluku & Papua";
  return "";
}

/** Filter hospital list by jenisRS only (kelasRS and provinsi removed from filter) */
export function filterHospitals(
  jenisRS?: string,
  kelasRS?: string,
  provinsi?: string,
): Hospital[] {
  return HOSPITALS.filter((h) => {
    if (jenisRS) {
      const kep = jenisRS.includes("Publik") ? "Publik" : "Swasta";
      if (h.kepemilikan !== kep) return false;
    }
    if (kelasRS) {
      const k = kelasRS.replace("Kelas ", "");
      if (h.kelas !== k) return false;
    }
    if (provinsi && h.provinsi !== provinsi) return false;
    return true;
  });
}
