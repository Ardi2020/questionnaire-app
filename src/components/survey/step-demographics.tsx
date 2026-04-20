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

  const wilayahAutoFilled = values.wilayah && values.hospitalId;

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
          {/* 1. Jenis RS only (kelas & provinsi removed — derived from hospital selection) */}
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

          {/* 3. Wilayah — auto-filled when hospital selected, manual otherwise */}
          {wilayahAutoFilled ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {DEMOGRAPHICS.wilayah.label}
              </label>
              <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary font-medium">
                {values.wilayah}
                <span className="text-xs text-muted-foreground font-normal ml-2">
                  (otomatis berdasarkan RS dipilih)
                </span>
              </div>
            </div>
          ) : (
            <DemographicField
              label={DEMOGRAPHICS.wilayah.label}
              options={DEMOGRAPHICS.wilayah.options}
              value={values.wilayah as string | undefined}
              onChange={(v) => onChange("wilayah", v)}
              error={errors.wilayah}
            />
          )}

          {/* 4-5. Profesi & Pengalaman */}
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
