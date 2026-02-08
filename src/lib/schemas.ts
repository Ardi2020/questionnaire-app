import { z } from "zod";

const requiredField = z
  .string({ error: "Harap pilih salah satu opsi" })
  .min(1, "Harap pilih salah satu opsi");
const likertValue = z.coerce
  .number({ error: "Harap pilih salah satu nilai" })
  .min(1, "Harap pilih salah satu nilai")
  .max(7);

export const demographicsSchema = z.object({
  jenisRS: requiredField,
  kelasRS: requiredField,
  wilayah: requiredField,
  profesi: requiredField,
  pengalaman: requiredField,
});

export const tiSchema = z.object({
  TI1: likertValue,
  TI2: likertValue,
  TI3: likertValue,
  TI4: likertValue,
});

export const osSchema = z.object({
  OS1: likertValue,
  OS2: likertValue,
  OS3: likertValue,
  OS4: likertValue,
});

export const dcSchema = z.object({
  DC1: likertValue,
  DC2: likertValue,
  DC3: likertValue,
  DC4: likertValue,
});

export const peouSchema = z.object({
  PEOU1: likertValue,
  PEOU2: likertValue,
  PEOU3: likertValue,
  PEOU4: likertValue,
});

export const puSchema = z.object({
  PU1: likertValue,
  PU2: likertValue,
  PU3: likertValue,
  PU4: likertValue,
});

export const biSchema = z.object({
  BI1: likertValue,
  BI2: likertValue,
  BI3: likertValue,
});

export const readSchema = z.object({
  READ1: likertValue,
  READ2: likertValue,
  READ3: likertValue,
  READ4: likertValue,
  READ_G1: likertValue,
});

export const fullSurveySchema = demographicsSchema
  .merge(tiSchema)
  .merge(osSchema)
  .merge(dcSchema)
  .merge(peouSchema)
  .merge(puSchema)
  .merge(biSchema)
  .merge(readSchema);

// Schema for each wizard step (index matches step number - 1 for demographics, step 2-8 for likert)
export const stepSchemas = [
  null, // Step 0: Welcome (no validation)
  demographicsSchema, // Step 1
  tiSchema, // Step 2
  osSchema, // Step 3
  dcSchema, // Step 4
  peouSchema, // Step 5
  puSchema, // Step 6
  biSchema, // Step 7
  readSchema, // Step 8
  null, // Step 9: Review
  null, // Step 10: Thank you
];
