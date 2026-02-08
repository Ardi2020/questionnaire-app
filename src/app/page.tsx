import { SurveyWizard } from "@/components/survey/survey-wizard";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <SurveyWizard />
      </main>
    </div>
  );
}
