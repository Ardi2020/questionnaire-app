"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DEMOGRAPHICS, SECTIONS, LIKERT_LABELS } from "@/lib/questions";
import type { PartialSurveyData } from "@/lib/types";

interface StepReviewProps {
  formData: PartialSurveyData;
  onEdit: (step: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const DEMO_FIELDS = [
  "jenisRS",
  "kelasRS",
  "wilayah",
  "profesi",
  "pengalaman",
] as const;

export function StepReview({
  formData,
  onEdit,
  onSubmit,
  isSubmitting,
}: StepReviewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">
          Review Jawaban Anda
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Periksa kembali jawaban Anda sebelum mengirim.
        </p>
      </div>

      {/* Demographics */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Profil Responden</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(1)}
            className="text-primary"
          >
            Edit
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {DEMO_FIELDS.map((field) => (
              <div key={field} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {DEMOGRAPHICS[field].label}
                </span>
                <span className="font-medium text-foreground">
                  {(formData as Record<string, unknown>)[field] as string || "-"}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Likert sections */}
      {SECTIONS.map((section, sectionIndex) => (
        <Card key={section.id}>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">
              {section.letter}. {section.title}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(sectionIndex + 2)}
              className="text-primary"
            >
              Edit
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {section.items.map((item) => {
                const val = (formData as Record<string, unknown>)[
                  item.code
                ] as number | undefined;
                return (
                  <div key={item.code} className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex-1 mr-4">
                      <span className="font-medium text-foreground/70">
                        {item.code}
                      </span>{" "}
                      &mdash;{" "}
                      {item.text.length > 60
                        ? item.text.slice(0, 60) + "..."
                        : item.text}
                    </span>
                    <span className="font-medium text-foreground shrink-0">
                      {val ? `${val} (${LIKERT_LABELS[val]})` : "-"}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      <Separator />

      <div className="flex justify-center pt-2">
        <Button
          size="lg"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full sm:w-auto px-12"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Mengirim...
            </span>
          ) : (
            "Kirim Jawaban"
          )}
        </Button>
      </div>
    </div>
  );
}
