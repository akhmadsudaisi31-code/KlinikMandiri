import { ClinicType } from "../types";

function normalizeClinicType(clinicType?: string | null): string {
  return String(clinicType || "").trim().toLowerCase();
}

export function isDentalClinicType(clinicType?: string | null): boolean {
  const norm = normalizeClinicType(clinicType);
  return norm === "dokter gigi" || norm === "gigi" || norm === "dental";
}

export function getClinicThemeClass(clinicType?: ClinicType | string | null): string {
  const normalized = normalizeClinicType(clinicType);
  if (normalized === "dokter gigi") return "theme-dokter-gigi";
  if (normalized === "perawat") return "theme-perawat";
  if (normalized === "dokter") {
    return "theme-dokter";
  }
  return "theme-bidan";
}

export function getExaminationUnitLabel(clinicType?: string | null): string {
  return isDentalClinicType(clinicType) ? "Poli Gigi" : "Poli Pemeriksaan";
}

export function getExaminationQueueLabel(clinicType?: string | null): string {
  return isDentalClinicType(clinicType) ? "pelayanan gigi" : "pemeriksaan";
}

export function getExamPageTitle(clinicType?: string | null): string {
  return isDentalClinicType(clinicType) ? "Pelayanan Gigi" : "Pemeriksaan SOAP";
}
