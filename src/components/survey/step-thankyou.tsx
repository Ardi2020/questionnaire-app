"use client";

import { Card, CardContent } from "@/components/ui/card";
import { RESEARCHER_INFO } from "@/lib/questions";

export function StepThankYou() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        {/* Success icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-2">
          <svg
            className="w-10 h-10 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-foreground">Terima Kasih!</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Jawaban Anda telah berhasil dikirim dan dicatat. Partisipasi Anda
          sangat berarti bagi penelitian ini.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            Jika Anda memiliki pertanyaan mengenai penelitian ini, silakan
            hubungi:
          </p>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {RESEARCHER_INFO.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {RESEARCHER_INFO.program}
            </p>
            <p className="text-xs text-muted-foreground">
              {RESEARCHER_INFO.university}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
