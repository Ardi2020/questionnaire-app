"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  SURVEY_TITLE,
  RESEARCHER_INFO,
  INTRO_TEXT,
  CONFIDENTIALITY_TEXT,
  BDA_AI_DEFINITIONS,
} from "@/lib/questions";

interface StepWelcomeProps {
  onNext: () => void;
}

export function StepWelcome({ onNext }: StepWelcomeProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
          <svg
            className="w-8 h-8 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
          {SURVEY_TITLE}
        </h1>
        <p className="text-sm text-muted-foreground">
          {RESEARCHER_INFO.program} &mdash; {RESEARCHER_INFO.university},{" "}
          {RESEARCHER_INFO.year}
        </p>
      </div>

      <Separator />

      {/* Introduction */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <p className="text-sm leading-relaxed whitespace-pre-line text-foreground">
            {INTRO_TEXT}
          </p>

          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
            <div className="flex gap-2 items-start">
              <svg
                className="w-5 h-5 text-primary shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-primary">
                  Jaminan Kerahasiaan
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {CONFIDENTIALITY_TEXT}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BDA-AI Definitions */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-2 items-center mb-2">
            <svg
              className="w-5 h-5 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-sm font-semibold text-foreground">
              Apa itu BDA-AI? (Definisi Operasional)
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Agar kita memiliki pemahaman yang sama dalam pengisian kuesioner ini:
          </p>
          <div className="space-y-3">
            {BDA_AI_DEFINITIONS.map((def) => (
              <div
                key={def.term}
                className="rounded-lg border bg-muted/30 p-3"
              >
                <p className="text-sm font-medium text-foreground">
                  {def.term}
                </p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {def.definition}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Start button */}
      <div className="flex justify-center pt-2">
        <Button size="lg" onClick={onNext} className="w-full sm:w-auto px-12">
          Mulai Kuesioner
        </Button>
      </div>
    </div>
  );
}
