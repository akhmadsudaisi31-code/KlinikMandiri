export const GENDERS = ["Laki-laki", "Perempuan"] as const;
export const CATEGORIES = [
  "Tuan",
  "Nyonya",
  "Nona",
  "Saudara",
  "Anak",
  "Bayi",
] as const;
export const POLI_OPTIONS = ["Umum", "Pemeriksaan"] as const;
export const MEDICINE_UNITS = [
  "Tablet",
  "Kapsul",
  "Sirup",
  "Salep",
  "Ampul",
  "Botol",
  "Strip",
] as const;

export type Gender = (typeof GENDERS)[number];
export type Category = (typeof CATEGORIES)[number];
export type PoliType = (typeof POLI_OPTIONS)[number];
export type MedicineUnit = (typeof MEDICINE_UNITS)[number];

export interface Patient {
  id: string;
  rm: string;
  name: string;
  namaSuami?: string;
  gender: Gender;
  category: Category;
  address: string;
  dob: string | null;
  ageYears: number | null;
  ageMonths: number | null;
  ageDisplay: string;
  poli: PoliType; // Poli tujuan: Umum atau Pemeriksaan
  allergies?: string; // Data alergi permanen
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// --- TIPE UNTUK OBAT ---
export interface Medicine {
  id: string;
  name: string;
  unit: MedicineUnit;
  price: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// --- TIPE UNTUK NOTIFIKASI ---
export interface Notification {
  id: string;
  type: "NEW_PATIENT" | "CALL_PATIENT";
  patientId: string;
  patientName: string;
  message: string;
  read: boolean;
  createdAt: string;
  toRole: "pemeriksa" | "pendaftar";
}

// --- TIPE UNTUK PEMERIKSAAN (SOAP STANDAR INDONESIA) ---
export interface Examination {
  id: string;
  patientId: string;
  patientName: string;
  patientRm: string;

  // S: Subjective
  keluhanUtama: string;
  riwayatPenyakitSekarang?: string;

  // O: Objective (Pemeriksaan Fisik & Vital Signs)
  tensi?: string; // mmHg
  nadi?: number; // x/menit
  suhu?: number; // Celsius
  respirasi?: number; // x/menit
  bb?: number; // kg
  tb?: number; // cm
  spo2?: number; // %
  pemeriksaanFisik?: string;

  // A: Assessment (Diagnosa)
  diagnosa: string;
  icd10?: string; // Kode ICD-10

  // P: Plan (Terapi & Rencana Tindak Lanjut)
  medicines: MedicineItem[];
  tindakan?: string;
  edukasi?: string;
  rencanaTindakLanjut?: string;

  // Extended Data for Specific Reports
  extendedData_json?: string; // JSON string holding AncData or PersalinanData

  biaya?: number;
  date: string;
  createdAt: string;
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
  date: string; // Tanggal & Waktu kunjungan
  diagnosis: string;
  therapy: string; // Tindakan/Obat
  notes: string; // Catatan tambahan
  cost: number; // Biaya (opsional)
  createdBy: string;
}

export const EXAM_CATEGORIES = [
  "Umum",
  "Lansia",
  "Bumil",
] as const;
export type ExamCategory = (typeof EXAM_CATEGORIES)[number];

export interface KbData {
  akseptor: string; // Baru / Lama
  metodeKb: string; // IUD, Suntik, Pil, Implant, Kondom
  keluhanKb?: string;
  tglKembaliKb?: string;
}

export interface AncData {
  hamilKe: string;
  usiaKehamilan: string;
  anakTerkecil: string;
  hpht: string;
  hpl: string;
  tglKunjunganK1?: string;
  tglKunjunganK4?: string;
  statusTT: string;
  lila: string;
  skor: string;
  usg: string;
}

export interface PersalinanData {
  hamilKe: string;
  usiaKehamilan: string;
  jenisPersalinan: string;
  penolong: string;
  tempat: string;
  jenisKelamin: string;
  tglPartus: string;
  jamPartus: string;
  as: string; // Apgar Score
  bbl: string; // Berat Badan Lahir
  pb: string; // Panjang Badan
  lika: string; // Lingkar Kepala
  vitK: string;
  hb0: string;
}

export interface PatientFormData {
  name: string;
  namaSuami?: string;
  gender: Gender;
  category: Category;
  address: string;
  dob: string;
  ageYears: string;
  ageMonths: string;
  poli: PoliType;
}

// --- TIPE UNTUK USER / KLINIK ---
export interface Clinic {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  status: "pending" | "active" | "inactive";
  isAdmin: number; // 0: false, 1: true
  subscriptionPlan?: string;
}

export const ALL_FEATURES = [
  "Rekam Medis SOAP Standar",
  "Database Pasien Unlimited",
  "Manajemen Stok Obat",
  "Laporan Kunjungan & Grafik",
  "Akses Multi-Device",
  "Backup Data Cloud Otomatis",
];

export const SUBSCRIPTION_PLANS = [
  {
    id: "MONTHLY",
    name: "Paket 1 Bulan",
    price: 50000,
    duration: "per bulan",
    features: ALL_FEATURES,
  },
  {
    id: "YEARLY",
    name: "Paket 1 Tahun",
    price: 600000,
    duration: "per tahun",
    features: ALL_FEATURES,
  },
  {
    id: "2YEARS",
    name: "Paket 2 Tahun",
    price: 1150000,
    duration: "per 2 tahun",
    features: ALL_FEATURES,
  },
  {
    id: "LIFETIME",
    name: "Paket Selamanya",
    price: 3500000, // Harga promo contoh untuk lifetime
    duration: "selamanya",
    features: ALL_FEATURES,
  },
];
