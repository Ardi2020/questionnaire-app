"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LikertScale } from "./likert-scale";
import type { Section } from "@/lib/questions";

interface StepLikertSectionProps {
  section: Section;
  values: Record<string, number | undefined>;
  errors: Record<string, string | undefined>;
  onChange: (code: string, value: number) => void;
}

export function StepLikertSection({
  section,
  values,
  errors,
  onChange,
}: StepLikertSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">
          {section.letter}. {section.title}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          ({section.titleEn})
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Berilah penilaian seberapa setuju Anda dengan pernyataan berikut pada
            skala 1 sampai 7.
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {section.items.map((item, index) => (
            <div key={item.code}>
              {index > 0 && <Separator className="mb-6" />}
              <LikertScale
                code={item.code}
                text={item.text}
                value={values[item.code]}
                onChange={(v) => onChange(item.code, v)}
                error={errors[item.code]}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
