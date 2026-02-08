"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "./progress-bar";
import { StepWelcome } from "./step-welcome";
import { StepDemographics } from "./step-demographics";
import { StepLikertSection } from "./step-likert-section";
import { StepReview } from "./step-review";
import { StepThankYou } from "./step-thankyou";
import { SECTIONS } from "@/lib/questions";
import { stepSchemas } from "@/lib/schemas";
import { useSurveyStore } from "@/lib/store";
import type { PartialSurveyData } from "@/lib/types";

const TOTAL_STEPS = 11; // 0=welcome, 1=demo, 2-8=likert, 9=review, 10=thanks

export function SurveyWizard() {
  const {
    formData,
    currentStep,
    isSubmitted,
    updateFormData,
    setCurrentStep,
    setSubmitted,
    reset,
  } = useSurveyStore();

  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const validateCurrentStep = useCallback(() => {
    const schema = stepSchemas[currentStep];
    if (!schema) return true;

    const result = schema.safeParse(formData);
    if (result.success) {
      setErrors({});
      return true;
    }

    const fieldErrors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      const field = issue.path[0] as string;
      const msg = issue.message;
      // Override pesan Zod default yang tidak user-friendly
      fieldErrors[field] =
        msg.includes("Invalid") || msg.includes("expected")
          ? "Harap diisi"
          : msg;
    });
    setErrors(fieldErrors);
    return false;
  }, [currentStep, formData]);

  const handleNext = useCallback(() => {
    if (validateCurrentStep()) {
      setErrors({});
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [validateCurrentStep, currentStep, setCurrentStep]);

  const handlePrev = useCallback(() => {
    setErrors({});
    setCurrentStep(currentStep - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep, setCurrentStep]);

  const handleEdit = useCallback(
    (step: number) => {
      setErrors({});
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [setCurrentStep]
  );

  const handleDemographicChange = useCallback(
    (field: string, value: string) => {
      updateFormData({ [field]: value } as PartialSurveyData);
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    [updateFormData]
  );

  const handleLikertChange = useCallback(
    (code: string, value: number) => {
      updateFormData({ [code]: value } as PartialSurveyData);
      setErrors((prev) => ({ ...prev, [code]: undefined }));
    },
    [updateFormData]
  );

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Gagal mengirim jawaban");
      }

      setSubmitted();
      setCurrentStep(TOTAL_STEPS - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan. Silakan coba lagi."
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, setSubmitted, setCurrentStep]);

  // Hydration guard
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // If already submitted, show thank you
  const step = isSubmitted ? TOTAL_STEPS - 1 : currentStep;

  const renderStep = () => {
    switch (step) {
      case 0:
        return <StepWelcome onNext={handleNext} />;
      case 1:
        return (
          <StepDemographics
            values={formData as Record<string, string | undefined>}
            errors={errors}
            onChange={handleDemographicChange}
          />
        );
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
      case 8: {
        const sectionIndex = step - 2;
        const section = SECTIONS[sectionIndex];
        const sectionValues: Record<string, number | undefined> = {};
        section.items.forEach((item) => {
          sectionValues[item.code] = (formData as Record<string, unknown>)[
            item.code
          ] as number | undefined;
        });
        return (
          <StepLikertSection
            section={section}
            values={sectionValues}
            errors={errors}
            onChange={handleLikertChange}
          />
        );
      }
      case 9:
        return (
          <StepReview
            formData={formData}
            onEdit={handleEdit}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        );
      case 10:
        return <StepThankYou />;
      default:
        return null;
    }
  };

  const showNavigation = step >= 1 && step <= 8;

  return (
    <div className="space-y-6">
      <ProgressBar currentStep={step} totalSteps={TOTAL_STEPS} />

      {renderStep()}

      {showNavigation && (
        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={step === 0}
          >
            Sebelumnya
          </Button>
          <Button onClick={handleNext}>
            {step === 8 ? "Review Jawaban" : "Selanjutnya"}
          </Button>
        </div>
      )}
    </div>
  );
}
