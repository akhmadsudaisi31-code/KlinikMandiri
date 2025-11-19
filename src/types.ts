import { Timestamp } from "firebase/firestore";

export const GENDERS = ["Laki-laki", "Perempuan"] as const;
export const CATEGORIES = ["Tuan", "Nyonya", "Nona", "Saudara", "Anak", "Bayi"] as const;

export type Gender = typeof GENDERS[number];
export type Category = typeof CATEGORIES[number];

export interface Patient {
  id: string;
  rm: string;
  name: string;
  gender: Gender;
  category: Category;
  address: string;
  dob: string | null;
  ageYears: number | null;
  ageMonths: number | null;
  ageDisplay: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

// --- TIPE BARU UNTUK KUNJUNGAN ---
export interface Visit {
  id: string;
  patientId: string;
  patientName: string;
  patientRm: string;
  date: Timestamp; // Tanggal & Waktu kunjungan
  diagnosis: string;
  therapy: string; // Tindakan/Obat
  notes: string; // Catatan tambahan
  cost: number; // Biaya (opsional)
  createdBy: string;
}

export interface PatientFormData {
  name: string;
  gender: Gender;
  category: Category;
  address: string;
  dob: string;
  ageYears: string;
  ageMonths: string;
}