"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { filterHospitals, type Hospital } from "@/lib/hospitals";

interface HospitalSelectorProps {
  jenisRS?: string;
  kelasRS?: string;
  provinsi?: string;
  value?: string;
  hospitalId?: number;
  onChange: (nama: string, hospitalId?: number) => void;
  error?: string;
}

export function HospitalSelector({
  jenisRS,
  kelasRS,
  provinsi,
  value,
  onChange,
  error,
}: HospitalSelectorProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const isLainnya = provinsi === "Lainnya";
  const hasFilters = jenisRS && kelasRS && provinsi;

  const filtered = useMemo(() => {
    if (!hasFilters || isLainnya) return [];
    return filterHospitals(jenisRS, kelasRS, provinsi);
  }, [jenisRS, kelasRS, provinsi, hasFilters, isLainnya]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return filtered;
    const q = search.toLowerCase();
    return filtered.filter(
      (h) =>
        h.nama.toLowerCase().includes(q) ||
        h.kotaKab.toLowerCase().includes(q)
    );
  }, [filtered, search]);

  // If "Lainnya" province, show text input
  if (isLainnya) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Nama Rumah Sakit
        </label>
        <input
          type="text"
          placeholder="Ketik nama rumah sakit Anda..."
          value={value || ""}
          onChange={(e) => onChange(e.target.value, undefined)}
          className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  // Not enough filters yet
  if (!hasFilters) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Nama Rumah Sakit
        </label>
        <div className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
          Pilih jenis RS, kelas, dan provinsi terlebih dahulu.
        </div>
      </div>
    );
  }

  // No hospitals match
  if (filtered.length === 0) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Nama Rumah Sakit
        </label>
        <input
          type="text"
          placeholder="RS Anda tidak ada di daftar — ketik nama manual..."
          value={value || ""}
          onChange={(e) => onChange(e.target.value, undefined)}
          className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <p className="text-xs text-muted-foreground">
          Tidak ada RS target di kombinasi filter ini. Silakan ketik nama RS
          Anda secara manual.
        </p>
        {error && <p className="text-xs text-destructive">{error}</p>}
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
          placeholder="Cari nama RS..."
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
              onChange("", undefined);
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
        <div className="max-h-60 overflow-y-auto rounded-lg border border-border bg-card shadow-md">
          {searchResults.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              Tidak ditemukan. Ketik nama RS yang tepat di kolom pencarian.
            </div>
          ) : (
            searchResults.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => {
                  onChange(h.nama, h.id);
                  setSearch("");
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full text-left px-4 py-3 text-sm border-b border-border/50 last:border-0 transition-colors",
                  value === h.nama
                    ? "bg-primary/5 text-primary font-medium"
                    : "hover:bg-accent/50 text-foreground"
                )}
              >
                <div className="font-medium">{h.nama}</div>
                <div className="text-xs text-muted-foreground">
                  {h.kotaKab} — Kelas {h.kelas} {h.kepemilikan}
                </div>
              </button>
            ))
          )}

          {/* Option to type manually */}
          <button
            type="button"
            onClick={() => {
              onChange(search || "", undefined);
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
