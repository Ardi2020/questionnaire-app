export interface DemographicsData {
  jenisRS: string;
  kelasRS: string;
  wilayah: string;
  profesi: string;
  pengalaman: string;
}

export interface LikertData {
  TI1: number;
  TI2: number;
  TI3: number;
  TI4: number;
  OS1: number;
  OS2: number;
  OS3: number;
  OS4: number;
  DC1: number;
  DC2: number;
  DC3: number;
  DC4: number;
  PEOU1: number;
  PEOU2: number;
  PEOU3: number;
  PEOU4: number;
  PU1: number;
  PU2: number;
  PU3: number;
  PU4: number;
  BI1: number;
  BI2: number;
  BI3: number;
  READ1: number;
  READ2: number;
  READ3: number;
  READ4: number;
  READ_G1: number;
}

export type SurveyFormData = DemographicsData & LikertData;

export type PartialSurveyData = Partial<SurveyFormData>;
