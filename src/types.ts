import { Timestamp } from "firebase/firestore";

export const GENDERS = ["Laki-laki", "Perempuan"] as const;
export const CATEGORIES = ["Tuan", "Nyonya", "Nona", "Saudara", "Anak", "Bayi"] as const;
export const POLI_OPTIONS = ["Umum", "Pemeriksaan"] as const;
export const MEDICINE_UNITS = ["Tablet", "Kapsul", "Sirup", "Salep", "Ampul", "Botol", "Strip"] as const;

export type Gender = typeof GENDERS[number];
export type Category = typeof CATEGORIES[number];
export type PoliType = typeof POLI_OPTIONS[number];
export type MedicineUnit = typeof MEDICINE_UNITS[number];

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
  poli: PoliType; // Poli tujuan: Umum atau Pemeriksaan
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

// --- TIPE UNTUK OBAT ---
export interface Medicine {
  id: string;
  name: string;
  unit: MedicineUnit;
  price: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

// --- TIPE UNTUK PEMERIKSAAN ---
export interface Examination {
  id: string;
  patientId: string;
  patientName: string;
  patientRm: string;
  keluhan: string; // Keluhan pasien
  pemeriksaan: string; // Hasil pemeriksaan
  diagnosa: string; // Diagnosa
  medicines: MedicineItem[]; // Obat yang diberikan
  biaya?: number; // Biaya (optional)
  date: Timestamp; // Tanggal pemeriksaan
  createdAt: Timestamp;
  createdBy: string;
}

export interface MedicineItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  unit: MedicineUnit;
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
  poli: PoliType;
}