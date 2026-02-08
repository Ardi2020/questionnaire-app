"use client";

import { cn } from "@/lib/utils";
import { STEP_LABELS } from "@/lib/questions";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  // Don't show on welcome (0) or thank you (10)
  if (currentStep === 0 || currentStep >= totalSteps - 1) return null;

  const progressSteps = STEP_LABELS.slice(1); // Skip "Mulai"
  const activeIndex = currentStep - 1;

  return (
    <div className="w-full space-y-2">
      {/* Progress bar */}
      <div className="flex gap-1">
        {progressSteps.map((_, index) => (
          <div
            key={index}
            className={cn(
              "h-1.5 rounded-full flex-1 transition-colors",
              index < activeIndex
                ? "bg-primary"
                : index === activeIndex
                ? "bg-primary/70"
                : "bg-muted"
            )}
          />
        ))}
      </div>

      {/* Step labels */}
      <div className="flex justify-between">
        <span className="text-xs text-muted-foreground">
          Langkah {currentStep} dari {totalSteps - 2}
        </span>
        <span className="text-xs font-medium text-primary">
          {progressSteps[activeIndex]}
        </span>
      </div>
    </div>
  );
}
