"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { getWilayahFromProvinsi } from "@/lib/hospitals";

interface HospitalFromAPI {
  id: number;
  no_urut: number;
  nama_rs: string;
  kelas_rs: string;
  kelas_terkini: string;
  kepemilikan: string;
  strata: string;
  target_mga: string;
  provinsi: string;
  kota_kabupaten: string;
  is_active: boolean;
}

export interface HospitalData {
  id: number;
  nama: string;
  kelas: string;
  kepemilikan: string;
  provinsi: string;
  kotaKab: string;
  wilayah: string;
}

interface HospitalSelectorProps {
  jenisRS?: string;
  value?: string;
  hospitalId?: number;
  onChange: (nama: string, hospitalId?: number, hospital?: HospitalData) => void;
  error?: string;
}

export function HospitalSelector({
  jenisRS,
  value,
  onChange,
  error,
}: HospitalSelectorProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [allHospitals, setAllHospitals] = useState<HospitalFromAPI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/hospitals")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setAllHospitals(data.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!jenisRS) return allHospitals;
    const isPubik = jenisRS.includes("Publik") || jenisRS.includes("Pemerintah");
    return allHospitals.filter((h) =>
      isPubik ? h.kepemilikan === "Publik" : h.kepemilikan === "Swasta"
    );
  }, [allHospitals, jenisRS]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return filtered;
    const q = search.toLowerCase();
    return filtered.filter(
      (h) =>
        h.nama_rs.toLowerCase().includes(q) ||
        h.kota_kabupaten.toLowerCase().includes(q) ||
        h.provinsi.toLowerCase().includes(q)
    );
  }, [filtered, search]);

  const handleSelect = (h: HospitalFromAPI) => {
    const hospitalData: HospitalData = {
      id: h.id,
      nama: h.nama_rs,
      kelas: h.kelas_rs,
      kepemilikan: h.kepemilikan,
      provinsi: h.provinsi,
      kotaKab: h.kota_kabupaten,
      wilayah: getWilayahFromProvinsi(h.provinsi),
    };
    onChange(h.nama_rs, h.id, hospitalData);
    setSearch("");
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Nama Rumah Sakit
        </label>
        <div className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
          Memuat daftar RS...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        Nama Rumah Sakit{" "}
        <span className="text-muted-foreground font-normal">
          ({filtered.length} RS tersedia)
        </span>
      </label>

      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Cari nama RS, kota, atau provinsi..."
          value={value && !isOpen ? value : search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearch("");
          }}
          className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("", undefined, undefined);
              setSearch("");
              setIsOpen(true);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown list */}
      {isOpen && (
        <div className="max-h-64 overflow-y-auto rounded-lg border border-border bg-card shadow-md">
          {searchResults.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              Tidak ditemukan. Coba kata kunci lain atau gunakan nama manual.
            </div>
          ) : (
            searchResults.slice(0, 50).map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => handleSelect(h)}
                className={cn(
                  "w-full text-left px-4 py-3 text-sm border-b border-border/50 last:border-0 transition-colors",
                  value === h.nama_rs
                    ? "bg-primary/5 text-primary font-medium"
                    : "hover:bg-accent/50 text-foreground"
                )}
              >
                <div className="font-medium">{h.nama_rs}</div>
                <div className="text-xs text-muted-foreground">
                  {h.kota_kabupaten}, {h.provinsi} — Kelas {h.kelas_rs} {h.kepemilikan}
                </div>
              </button>
            ))
          )}

          {/* Manual entry option */}
          <button
            type="button"
            onClick={() => {
              onChange(search || "", undefined, undefined);
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-3 text-sm text-muted-foreground hover:bg-accent/50 border-t border-border"
          >
            RS saya tidak ada di daftar — gunakan nama:{" "}
            <span className="font-medium text-foreground">
              {search || "(ketik di kolom pencarian)"}
            </span>
          </button>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
