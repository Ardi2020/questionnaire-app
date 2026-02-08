import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PartialSurveyData } from "./types";

interface SurveyStore {
  formData: PartialSurveyData;
  currentStep: number;
  isSubmitted: boolean;
  updateFormData: (data: PartialSurveyData) => void;
  setCurrentStep: (step: number) => void;
  setSubmitted: () => void;
  reset: () => void;
}

export const useSurveyStore = create<SurveyStore>()(
  persist(
    (set) => ({
      formData: {},
      currentStep: 0,
      isSubmitted: false,
      updateFormData: (data) =>
        set((state) => ({
          formData: { ...state.formData, ...data },
        })),
      setCurrentStep: (step) => set({ currentStep: step }),
      setSubmitted: () => set({ isSubmitted: true }),
      reset: () =>
        set({ formData: {}, currentStep: 0, isSubmitted: false }),
    }),
    {
      name: "survey-questionnaire-storage",
    }
  )
);
