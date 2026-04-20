"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DemographicField } from "./demographic-field";
import { HospitalSelector, type HospitalData } from "./hospital-selector";
import { DEMOGRAPHICS } from "@/lib/questions";
import { getWilayahFromProvinsi } from "@/lib/hospitals";

interface StepDemographicsProps {
  values: Record<string, string | number | undefined>;
  errors: Record<string, string | undefined>;
  onChange: (field: string, value: string | number) => void;
}

// Only jenisRS remains as a required user-input filter
const BASIC_FIELDS = ["jenisRS"];
const POST_RS_FIELDS = ["profesi", "pengalaman"];

export function StepDemographics({
  values,
  errors,
  onChange,
}: StepDemographicsProps) {

  // When a hospital is selected from the list, auto-fill all derived fields
  const handleHospitalChange = (nama: string, hospitalId?: number, hospital?: HospitalData) => {
    onChange("namaRS", nama);
    if (hospitalId) {
      onChange("hospitalId", hospitalId);
    } else {
      onChange("hospitalId", 0);
    }

    if (hospital) {
      // Auto-fill fields derived from hospital database record
      const kelasLabel = `Kelas ${hospital.kelas}`;
      onChange("kelasRS", kelasLabel);
      onChange("provinsiDetail", hospital.provinsi);

      // Auto-fill wilayah
      const wilayah = getWilayahFromProvinsi(hospital.provinsi);
      if (wilayah) {
        onChange("wilayah", wilayah);
      }

      // Auto-fill jenisRS if not already set
      if (!values.jenisRS) {
        const jenisLabel = hospital.kepemilikan === "Publik"
          ? "RS Pemerintah (Publik)"
          : "RS Swasta (Privat)";
        onChange("jenisRS", jenisLabel);
      }
    } else {
      // Manual entry — clear derived fields
      onChange("kelasRS", "");
      onChange("provinsiDetail", "");
      onChange("wilayah", "");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Profil Responden</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Mohon lengkapi identitas profesi Anda.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Pilih satu jawaban untuk setiap pertanyaan berikut.
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 1. Jenis RS only (kelas, provinsi & wilayah removed — all derived from hospital DB) */}
          {BASIC_FIELDS.map((field) => {
            const demo = DEMOGRAPHICS[field];
            return (
              <DemographicField
                key={field}
                label={demo.label}
                options={demo.options}
                value={values[field] as string | undefined}
                onChange={(v) => onChange(field, v)}
                error={errors[field]}
              />
            );
          })}

          {/* 2. Nama RS — searchable from full DB list, filtered by jenisRS */}
          <HospitalSelector
            jenisRS={values.jenisRS as string | undefined}
            value={values.namaRS as string | undefined}
            hospitalId={values.hospitalId as number | undefined}
            onChange={handleHospitalChange}
            error={errors.namaRS}
          />

          {/* Wilayah/Pulau hidden — auto-derived from hospital.provinsi, stored silently */}

          {/* 3-4. Profesi & Pengalaman */}
          {POST_RS_FIELDS.map((field) => {
            const demo = DEMOGRAPHICS[field];
            return (
              <DemographicField
                key={field}
                label={demo.label}
                options={demo.options}
                value={values[field] as string | undefined}
                onChange={(v) => onChange(field, v)}
                error={errors[field]}
              />
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
