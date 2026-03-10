import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Compute strata classification for a hospital
 * Based on jenis_rs (ownership) and kelas_rs (class)
 */
export function computeStrata(jenisRS: string | null, kelasRS: string | null): string {
  const jenis = jenisRS?.includes('Publik') || jenisRS?.includes('Pemerintah') ? 'Publik' : 'Swasta';
  const kelas = kelasRS?.replace('Kelas ', '').trim() || '?';
  if (jenis === 'Swasta' && (kelas === 'A' || kelas === 'B')) return 'Swasta_AB';
  return `${jenis} ${kelas}`;
}
