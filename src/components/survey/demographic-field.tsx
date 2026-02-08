"use client";

import { cn } from "@/lib/utils";

interface DemographicFieldProps {
  label: string;
  options: string[];
  value: string | undefined;
  onChange: (value: string) => void;
  error?: string;
}

export function DemographicField({
  label,
  options,
  value,
  onChange,
  error,
}: DemographicFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="grid gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              "flex items-center gap-3 rounded-lg border px-4 py-3 text-sm text-left transition-all cursor-pointer",
              value === option
                ? "border-primary bg-primary/5 text-primary font-medium shadow-sm"
                : "border-border bg-card hover:border-primary/40 hover:bg-accent/50 text-foreground"
            )}
          >
            <div
              className={cn(
                "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                value === option
                  ? "border-primary"
                  : "border-muted-foreground/40"
              )}
            >
              {value === option && (
                <div className="w-2 h-2 rounded-full bg-primary" />
              )}
            </div>
            {option}
          </button>
        ))}
      </div>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
