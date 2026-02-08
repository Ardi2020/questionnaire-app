"use client";

import { cn } from "@/lib/utils";
import { LIKERT_LABELS } from "@/lib/questions";

interface LikertScaleProps {
  code: string;
  text: string;
  value: number | undefined;
  onChange: (value: number) => void;
  error?: string;
}

export function LikertScale({
  code,
  text,
  value,
  onChange,
  error,
}: LikertScaleProps) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <span className="inline-flex items-center justify-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary shrink-0">
          {code}
        </span>
        <p className="text-sm leading-relaxed text-foreground">{text}</p>
      </div>

      <div className="space-y-1">
        {/* Scale labels - desktop */}
        <div className="hidden sm:flex justify-between px-1 mb-1">
          <span className="text-[10px] text-muted-foreground max-w-[80px] text-center leading-tight">
            Sangat Tidak Setuju
          </span>
          <span className="text-[10px] text-muted-foreground max-w-[60px] text-center leading-tight">
            Netral
          </span>
          <span className="text-[10px] text-muted-foreground max-w-[80px] text-center leading-tight">
            Sangat Setuju
          </span>
        </div>

        {/* Radio buttons */}
        <div className="flex justify-between gap-1 sm:gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={cn(
                "flex flex-col items-center gap-1 group cursor-pointer",
                "flex-1 min-w-0"
              )}
              title={LIKERT_LABELS[n]}
            >
              <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
                {n}
              </span>
              <div
                className={cn(
                  "w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center transition-all",
                  value === n
                    ? "border-primary bg-primary text-primary-foreground shadow-md scale-110"
                    : "border-border bg-card hover:border-primary/50 hover:bg-primary/5"
                )}
              >
                {value === n && (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Scale labels - mobile */}
        <div className="flex sm:hidden justify-between px-1 mt-1">
          <span className="text-[10px] text-muted-foreground">STS</span>
          <span className="text-[10px] text-muted-foreground">N</span>
          <span className="text-[10px] text-muted-foreground">SS</span>
        </div>
      </div>

      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}
    </div>
  );
}
