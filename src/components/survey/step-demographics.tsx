"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DemographicField } from "./demographic-field";
import { HospitalSelector } from "./hospital-selector";
import { DEMOGRAPHICS } from "@/lib/questions";
import { getWilayahFromProvinsi } from "@/lib/hospitals";

interface StepDemographicsProps {
  values: Record<string, string | number | undefined>;
  errors: Record<string, string | undefined>;
  onChange: (field: string, value: string | number) => void;
}

const BASIC_FIELDS = ["jenisRS", "kelasRS"];
const POST_RS_FIELDS = ["profesi", "pengalaman"];

export function StepDemographics({
  values,
  errors,
  onChange,
}: StepDemographicsProps) {
  const handleProvinsiChange = (value: string) => {
    onChange("provinsiDetail", value);

    // Auto-fill wilayah
    const wilayah = getWilayahFromProvinsi(value);
    if (wilayah) {
      onChange("wilayah", wilayah);
    } else {
      onChange("wilayah", "");
    }

    // Clear RS selection when province changes
    onChange("namaRS", "");
    onChange("hospitalId", 0);
  };

  const handleHospitalChange = (nama: string, hospitalId?: number) => {
    onChange("namaRS", nama);
    if (hospitalId) {
      onChange("hospitalId", hospitalId);
    } else {
      onChange("hospitalId", 0);
    }
  };

  const showWilayahManual =
    values.provinsiDetail === "Lainnya" && !values.wilayah;

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
          {/* 1-2. Jenis RS & Kelas RS */}
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

          {/* 3. Provinsi */}
          <DemographicField
            label={DEMOGRAPHICS.provinsiDetail.label}
            options={DEMOGRAPHICS.provinsiDetail.options}
            value={values.provinsiDetail as string | undefined}
            onChange={handleProvinsiChange}
            error={errors.provinsiDetail}
          />

          {/* 4. Nama RS (cascading dropdown) */}
          <HospitalSelector
            jenisRS={values.jenisRS as string | undefined}
            kelasRS={values.kelasRS as string | undefined}
            provinsi={values.provinsiDetail as string | undefined}
            value={values.namaRS as string | undefined}
            hospitalId={values.hospitalId as number | undefined}
            onChange={handleHospitalChange}
            error={errors.namaRS}
          />

          {/* 5. Wilayah — auto-filled or manual for "Lainnya" */}
          {showWilayahManual ? (
            <DemographicField
              label={DEMOGRAPHICS.wilayah.label}
              options={DEMOGRAPHICS.wilayah.options}
              value={values.wilayah as string | undefined}
              onChange={(v) => onChange("wilayah", v)}
              error={errors.wilayah}
            />
          ) : values.provinsiDetail && values.provinsiDetail !== "Lainnya" ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {DEMOGRAPHICS.wilayah.label}
              </label>
              <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary font-medium">
                {values.wilayah || "\u2014"}
                <span className="text-xs text-muted-foreground font-normal ml-2">
                  (otomatis berdasarkan provinsi)
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

          {/* 6-7. Profesi & Pengalaman */}
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
