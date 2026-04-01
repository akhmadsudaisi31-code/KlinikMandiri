export const ADULT_ODONTOGRAM_TEETH = [
  18, 17, 16, 15, 14, 13, 12, 11,
  21, 22, 23, 24, 25, 26, 27, 28,
  48, 47, 46, 45, 44, 43, 42, 41,
  31, 32, 33, 34, 35, 36, 37, 38,
] as const;

export const DENTAL_TOOTH_STATUSES = [
  "Normal",
  "Karies",
  "Tambalan",
  "Missing",
  "Sisa Akar",
  "Gigi Tiruan",
] as const;

export type DentalToothStatus = (typeof DENTAL_TOOTH_STATUSES)[number];

export interface OdontogramTooth {
  toothNumber: number;
  status: DentalToothStatus;
  note?: string;
}

export function createDefaultOdontogram(): OdontogramTooth[] {
  return ADULT_ODONTOGRAM_TEETH.map((toothNumber) => ({
    toothNumber,
    status: "Normal",
    note: "",
  }));
}

export function normalizeOdontogram(input: unknown): OdontogramTooth[] {
  if (!Array.isArray(input)) {
    return createDefaultOdontogram();
  }

  const byTooth = new Map<number, OdontogramTooth>();
  for (const item of input) {
    if (!item || typeof item !== "object") continue;
    const toothNumber = Number((item as any).toothNumber);
    const status = String((item as any).status || "Normal");
    if (!ADULT_ODONTOGRAM_TEETH.includes(toothNumber as any)) continue;
    if (!DENTAL_TOOTH_STATUSES.includes(status as DentalToothStatus)) continue;
    byTooth.set(toothNumber, {
      toothNumber,
      status: status as DentalToothStatus,
      note: typeof (item as any).note === "string" ? (item as any).note : "",
    });
  }

  return ADULT_ODONTOGRAM_TEETH.map((toothNumber) =>
    byTooth.get(toothNumber) || {
      toothNumber,
      status: "Normal",
      note: "",
    },
  );
}
