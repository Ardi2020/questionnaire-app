"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DemographicField } from "./demographic-field";
import { DEMOGRAPHICS } from "@/lib/questions";

interface StepDemographicsProps {
  values: Record<string, string | undefined>;
  errors: Record<string, string | undefined>;
  onChange: (field: string, value: string) => void;
}

const FIELD_ORDER = ["jenisRS", "kelasRS", "wilayah", "profesi", "pengalaman"];

export function StepDemographics({
  values,
  errors,
  onChange,
}: StepDemographicsProps) {
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
          {FIELD_ORDER.map((field) => {
            const demo = DEMOGRAPHICS[field];
            return (
              <DemographicField
                key={field}
                label={demo.label}
                options={demo.options}
                value={values[field]}
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
