import { useEffect, useMemo, useState } from "react";
import { DENTAL_TOOTH_STATUSES, OdontogramTooth } from "../utils/dental";

interface OdontogramEditorProps {
  teeth: OdontogramTooth[];
  onChange: (teeth: OdontogramTooth[]) => void;
}

const STATUS_BADGES: Record<string, string> = {
  Normal: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Karies: "border-red-200 bg-red-50 text-red-700",
  Tambalan: "border-blue-200 bg-blue-50 text-blue-700",
  Missing: "border-slate-200 bg-slate-100 text-slate-700",
  "Sisa Akar": "border-amber-200 bg-amber-50 text-amber-700",
  "Gigi Tiruan": "border-violet-200 bg-violet-50 text-violet-700",
};

const TOOTH_STROKE: Record<string, string> = {
  Normal: "#a8b3c7",
  Karies: "#ef4444",
  Tambalan: "#3b82f6",
  Missing: "#cbd5e1",
  "Sisa Akar": "#f59e0b",
  "Gigi Tiruan": "#8b5cf6",
};

function getToothFamily(toothNumber: number) {
  const isChild = toothNumber > 50;
  const lastDigit = toothNumber % 10;
  if (lastDigit === 1 || lastDigit === 2) return "incisor";
  if (lastDigit === 3) return "canine";
  if (isChild && (lastDigit === 4 || lastDigit === 5)) return "molar";
  if (lastDigit === 4 || lastDigit === 5) return "premolar";
  return "molar";
}

function getToothOutline(toothNumber: number, isUpper: boolean) {
  const family = getToothFamily(toothNumber);

  if (family === "incisor") {
    return isUpper
      ? "M20 14 C24 10 40 10 44 14 C47 18 47 28 45 36 C43 47 40 55 38 65 C36 78 35 90 32 90 C29 90 28 78 26 65 C24 55 21 47 19 36 C17 28 17 18 20 14 Z"
      : "M20 82 C24 86 40 86 44 82 C47 78 47 68 45 60 C43 49 40 41 38 31 C36 18 35 6 32 6 C29 6 28 18 26 31 C24 41 21 49 19 60 C17 68 17 78 20 82 Z";
  }

  if (family === "canine") {
    return isUpper
      ? "M18 16 C22 10 42 10 46 16 C48 20 47 30 45 38 C42 48 38 58 35 70 C34 80 34 90 32 90 C30 90 30 80 29 70 C26 58 22 48 19 38 C17 30 16 20 18 16 Z"
      : "M18 80 C22 86 42 86 46 80 C48 76 47 66 45 58 C42 48 38 38 35 26 C34 16 34 6 32 6 C30 6 30 16 29 26 C26 38 22 48 19 58 C17 66 16 76 18 80 Z";
  }

  if (family === "premolar") {
    return isUpper
      ? "M16 18 C20 12 44 12 48 18 C50 22 49 31 47 39 C45 48 42 54 39 61 C37 69 36 78 35 90 C34 90 33 90 32 90 C31 90 30 90 29 90 C28 78 27 69 25 61 C22 54 19 48 17 39 C15 31 14 22 16 18 Z"
      : "M16 78 C20 84 44 84 48 78 C50 74 49 65 47 57 C45 48 42 42 39 35 C37 27 36 18 35 6 C34 6 33 6 32 6 C31 6 30 6 29 6 C28 18 27 27 25 35 C22 42 19 48 17 57 C15 65 14 74 16 78 Z";
  }

  return isUpper
    ? "M14 20 C18 12 46 12 50 20 C52 24 52 34 49 42 C46 50 42 54 40 60 C38 69 38 78 37 90 C35 90 34 90 32 90 C30 90 29 90 27 90 C26 78 26 69 24 60 C22 54 18 50 15 42 C12 34 12 24 14 20 Z"
    : "M14 76 C18 84 46 84 50 76 C52 72 52 62 49 54 C46 46 42 42 40 36 C38 27 38 18 37 6 C35 6 34 6 32 6 C30 6 29 6 27 6 C26 18 26 27 24 36 C22 42 18 46 15 54 C12 62 12 72 14 76 Z";
}

function getToothDetailPath(toothNumber: number, isUpper: boolean) {
  const family = getToothFamily(toothNumber);

  if (family === "incisor") {
    return isUpper
      ? "M24 18 C27 15 37 15 40 18 M24 27 C28 30 36 30 40 27"
      : "M24 78 C27 81 37 81 40 78 M24 69 C28 66 36 66 40 69";
  }

  if (family === "canine") {
    return isUpper
      ? "M23 19 L32 15 L41 19 M27 31 L32 55 L37 31"
      : "M23 77 L32 81 L41 77 M27 65 L32 41 L37 65";
  }

  if (family === "premolar") {
    return isUpper
      ? "M22 22 C26 17 38 17 42 22 M24 31 C28 35 36 35 40 31"
      : "M22 74 C26 79 38 79 42 74 M24 65 C28 61 36 61 40 65";
  }

  return isUpper
    ? "M20 24 C24 18 40 18 44 24 M22 32 C27 36 37 36 42 32 M25 44 C28 46 36 46 39 44"
    : "M20 72 C24 78 40 78 44 72 M22 64 C27 60 37 60 42 64 M25 52 C28 50 36 50 39 52";
}

function ToothIcon({
  tooth,
  isUpper,
  active,
}: {
  tooth: OdontogramTooth;
  isUpper: boolean;
  active: boolean;
}) {
  const stroke = TOOTH_STROKE[tooth.status];
  const isMissing = tooth.status === "Missing";

  return (
    <svg
      viewBox="0 0 64 96"
      className={`h-16 w-10 transition-all duration-200 ${
        active ? "scale-[1.18] drop-shadow-[0_8px_18px_rgba(14,165,233,0.28)]" : "group-hover:scale-105"
      }`}
      aria-hidden="true"
    >
      <path
        d={getToothOutline(tooth.toothNumber, isUpper)}
        fill="#ffffff"
        stroke={stroke}
        strokeWidth="2.4"
        strokeLinejoin="round"
        opacity={isMissing ? 0.45 : 1}
      />
      {!isMissing && (
        <path
          d={getToothDetailPath(tooth.toothNumber, isUpper)}
          fill="none"
          stroke={active ? "#0ea5e9" : "#d1d9e6"}
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.95}
        />
      )}
      {active && (
        <path
          d={getToothOutline(tooth.toothNumber, isUpper)}
          fill="none"
          stroke="#38bdf8"
          strokeWidth="4.5"
          strokeLinejoin="round"
          opacity="0.2"
        />
      )}
    </svg>
  );
}

function ToothRow({
  teeth,
  isUpper,
  selectedToothNumber,
  onSelect,
}: {
  teeth: OdontogramTooth[];
  isUpper: boolean;
  selectedToothNumber: number;
  onSelect: (toothNumber: number) => void;
}) {
  return (
    <div className="flex min-w-max items-end gap-1.5">
      {teeth.map((tooth) => {
        const isActive = tooth.toothNumber === selectedToothNumber;
        return (
          <button
            key={tooth.toothNumber}
            type="button"
            onClick={() => onSelect(tooth.toothNumber)}
            className={`group relative flex w-11 shrink-0 flex-col items-center rounded-2xl border px-1 py-2 transition-all ${
              isActive
                ? "border-cyan-300 bg-cyan-50 shadow-[0_10px_24px_rgba(14,165,233,0.18)] ring-2 ring-cyan-100"
                : "border-transparent hover:border-gray-200 hover:bg-gray-50"
            }`}
          >
            {isActive && (
              <span className="absolute inset-x-2 top-1 h-1 rounded-full bg-cyan-400" />
            )}
            {isUpper ? (
              <>
                <ToothIcon tooth={tooth} isUpper={true} active={isActive} />
                <span className={`mt-1 text-[11px] font-black ${isActive ? "text-cyan-700" : "text-gray-500"}`}>
                  {tooth.toothNumber}
                </span>
              </>
            ) : (
              <>
                <span className={`mb-1 text-[11px] font-black ${isActive ? "text-cyan-700" : "text-gray-500"}`}>
                  {tooth.toothNumber}
                </span>
                <ToothIcon tooth={tooth} isUpper={false} active={isActive} />
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function OdontogramEditor({ teeth, onChange }: OdontogramEditorProps) {
  const [selectedToothNumber, setSelectedToothNumber] = useState<number>(
    teeth[0]?.toothNumber ?? 18,
  );

  useEffect(() => {
    if (!teeth.some((tooth) => tooth.toothNumber === selectedToothNumber)) {
      setSelectedToothNumber(teeth[0]?.toothNumber ?? 18);
    }
  }, [selectedToothNumber, teeth]);

  const upperAdultTeeth = teeth.slice(0, 16);
  const lowerAdultTeeth = teeth.slice(16, 32);
  const upperChildTeeth = teeth.slice(32, 42);
  const lowerChildTeeth = teeth.slice(42, 52);
  const selectedTooth = useMemo(
    () => teeth.find((tooth) => tooth.toothNumber === selectedToothNumber) ?? teeth[0],
    [selectedToothNumber, teeth],
  );

  const handleStatusChange = (
    toothNumber: number,
    status: OdontogramTooth["status"],
  ) => {
    onChange(
      teeth.map((tooth) =>
        tooth.toothNumber === toothNumber ? { ...tooth, status } : tooth,
      ),
    );
  };

  const handleNoteChange = (toothNumber: number, note: string) => {
    onChange(
      teeth.map((tooth) =>
        tooth.toothNumber === toothNumber ? { ...tooth, note } : tooth,
      ),
    );
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[2rem] border border-gray-200 bg-white p-4 shadow-sm">
        {/* Single scrollable container for all rows — prevents misalignment */}
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">

            {/* Row 1: Upper Adult (18→28) — teeth point downward */}
            <div className="flex justify-center pb-1">
              <ToothRow
                teeth={upperAdultTeeth}
                isUpper={true}
                selectedToothNumber={selectedToothNumber}
                onSelect={setSelectedToothNumber}
              />
            </div>

            {/* Row 2: Upper Child (55→65) — scaled smaller, flush to midline */}
            {upperChildTeeth.length > 0 && (
              <div className="flex justify-center">
                <div className="transform scale-[0.82] origin-bottom -mb-2">
                  <ToothRow
                    teeth={upperChildTeeth}
                    isUpper={true}
                    selectedToothNumber={selectedToothNumber}
                    onSelect={setSelectedToothNumber}
                  />
                </div>
              </div>
            )}

            {/* Midline Divider */}
            <div className="relative my-2">
              <div className="border-t-2 border-dashed border-gray-300" />
              <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-white px-2 text-[9px] font-bold uppercase tracking-widest text-gray-400">Garis Tengah</span>
            </div>

            {/* Row 3: Lower Child (85→75) — scaled smaller, flush to midline */}
            {lowerChildTeeth.length > 0 && (
              <div className="flex justify-center">
                <div className="transform scale-[0.82] origin-top -mt-2">
                  <ToothRow
                    teeth={lowerChildTeeth}
                    isUpper={false}
                    selectedToothNumber={selectedToothNumber}
                    onSelect={setSelectedToothNumber}
                  />
                </div>
              </div>
            )}

            {/* Row 4: Lower Adult (48→38) — teeth point upward */}
            <div className="flex justify-center pt-1">
              <ToothRow
                teeth={lowerAdultTeeth}
                isUpper={false}
                selectedToothNumber={selectedToothNumber}
                onSelect={setSelectedToothNumber}
              />
            </div>

          </div>
        </div>
      </div>

      {selectedTooth && (
        <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                Gigi Dipilih
              </p>
              <h4 className="text-2xl font-black text-gray-900">FDI {selectedTooth.toothNumber}</h4>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${STATUS_BADGES[selectedTooth.status]}`}>
              {selectedTooth.status}
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[220px,1fr]">
            <div>
              <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-gray-500">
                Status Odontogram
              </label>
              <select
                value={selectedTooth.status}
                onChange={(e) =>
                  handleStatusChange(
                    selectedTooth.toothNumber,
                    e.target.value as OdontogramTooth["status"],
                  )
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
              >
                {DENTAL_TOOTH_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-gray-500">
                Catatan Singkat
              </label>
              <input
                type="text"
                value={selectedTooth.note || ""}
                onChange={(e) =>
                  handleNoteChange(selectedTooth.toothNumber, e.target.value)
                }
                placeholder="Opsional"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
