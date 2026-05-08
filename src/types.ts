export const GENDERS = ["Laki-laki", "Perempuan"] as const;
export const CLINIC_TYPES = ["Bidan", "Perawat", "Dokter", "Dokter Gigi", "Terapis Gigi"] as const;
export const CATEGORIES = [
  "Tuan",
  "Nyonya",
  "Nona",
  "Saudara",
  "Anak",
  "Bayi",
] as const;
export const POLI_OPTIONS = ["Pendaftaran", "Pemeriksaan", "Selesai", "Selesai & Obat"] as const;
export const MEDICINE_UNITS = [
  "Tablet",
  "Kapsul",
  "Sirup",
  "Salep",
  "Ampul",
  "Botol",
  "Strip",
  "Puyer",
] as const;

export type Gender = (typeof GENDERS)[number];
export type ClinicType = (typeof CLINIC_TYPES)[number];
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
  occupation?: string;
  dob: string | null;
  ageYears: number | null;
  ageMonths: number | null;
  ageDisplay: string;
  poli: PoliType; // Poli tujuan: Pendaftaran atau Pemeriksaan
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
  aturanMinum?: string; // Legacy field
  signa?: string;       // New field (e.g. 3x1)
  aturanPakai?: string; // New field (e.g. Sesudah makan)
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
  "Odontologi",
  "KB",
  "Anak",
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

export interface LabData {
  gds?: string;
  asamUrat?: string;
  kolesterol?: string;
  hb?: string;
}

export interface PatientFormData {
  name: string;
  namaSuami?: string;
  gender: Gender;
  category: Category;
  address: string;
  occupation: string | null;
  dob: string | null;
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
  tier?: string;
}

export interface ClinicSettings {
  clinicId: string;
  clinicName?: string;
  doctorName: string;
  doctorNip?: string;
  clinicAddress?: string;
  clinicPhone?: string;
  lastSickLeaveNumber?: number;
  sickLeaveTemplate: string;
  enabledFeatures: {
    anc: boolean;
    kb: boolean;
    immunization: boolean;
    dental: boolean;
  };
  updatedAt?: string;
}

export const ALL_FEATURES = [
  "Rekam Medis SOAP Standar",
  "Database Pasien Unlimited",
  "Manajemen Stok Obat",
  "Laporan Kunjungan & Grafik",
  "Akses Multi-Device",
  "Backup Data Cloud Otomatis",
];

export const TIERS = [
  { 
    id: 'BASIC', 
    name: 'Basic', 
    description: 'Solusi Dasar Digitalisasi',
    features: ['Laporan Kunjungan', 'Manajemen Stok Obat', 'Pemeriksaan Umum (SOAP)', 'Database Pasien Unlimited']
  },
  { 
    id: 'STANDARD', 
    name: 'Standard', 
    description: 'Layanan Klinik Lengkap',
    features: ['Semua Fitur Basic', 'Layanan KIA (ANC, KB, Imunisasi)', 'Pemeriksaan Fisik Lengkap', 'Poli Mata & Gigi', 'Backup Data Manual', 'Multi-User Staff']
  },
  { 
    id: 'PRO', 
    name: 'Pro', 
    description: 'Optimasi Klinik Modern',
    features: ['Semua Fitur Standard', 'Cloud Backup Otomatis (Mingguan)', 'Upload Gambar Hasil Lab', 'Statistik Bisnis Lanjutan']
  }
] as const;

export type TierId = (typeof TIERS)[number]['id'];

export const SUBSCRIPTION_PLANS = [
  { id: "MONTHLY", name: "Paket 1 Bulan", duration: "per bulan" },
  { id: "YEARLY", name: "Paket 1 Tahun", duration: "per tahun" },
  { id: "2YEARS", name: "Paket 2 Tahun", duration: "per 2 tahun" },
  { id: "LIFETIME", name: "Paket Selamanya", duration: "selamanya" },
];

export const TIER_PRICES: Record<TierId, { monthly: number, yearly: number, twoYears: number, lifetime: number }> = {
  BASIC: {
    monthly: 35000,
    yearly: 350000,
    twoYears: 650000,
    lifetime: 2000000
  },
  STANDARD: {
    monthly: 50000,
    yearly: 600000,
    twoYears: 1150000,
    lifetime: 3500000
  },
  PRO: {
    monthly: 100000,
    yearly: 1000000,
    twoYears: 1800000,
    lifetime: 5000000
  }
};

export const getPlanPrice = (planId: string, tierId: TierId = 'STANDARD') => {
  const prices = TIER_PRICES[tierId];
  if (planId === 'MONTHLY') return prices.monthly;
  if (planId === 'YEARLY') return prices.yearly;
  if (planId === '2YEARS') return prices.twoYears;
  if (planId === 'LIFETIME') return prices.lifetime;
  return 0;
};
