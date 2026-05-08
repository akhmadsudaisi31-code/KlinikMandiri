import React from "react";
import { MedicineItem } from "../../types";
import { GenericSearchableSelect } from "../GenericSearchableSelect";

interface MedicineSectionProps {
  selectedMedicines: MedicineItem[];
  onRemove: (id: string) => void;
  onRuleChange: (id: string, value: string, field: "signa" | "aturanPakai" | "aturanMinum") => void;
  onQuantityChange: (id: string, quantity: number) => void;
  onOpenSelector: () => void;
  biayaDisplay: string;
  onBiayaChange: (val: string) => void;
  onBlurBiaya: () => void;
  isDentalClinic: boolean;
}

export const MedicineSection: React.FC<MedicineSectionProps> = ({
  selectedMedicines,
  onRemove,
  onRuleChange,
  onQuantityChange,
  onOpenSelector,
  biayaDisplay,
  onBiayaChange,
  onBlurBiaya,
  isDentalClinic,
}) => {
  return (
    <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-dark-border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="bg-green-100 p-2 rounded-lg text-green-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7 2a1 1 0 00-.707 1.707L14.293 11H3a1 1 0 100 2h11.293l-8 8.001a1 1 0 001.414 1.414l9.414-9.415a1 1 0 000-1.414l-9.414-9.414A1 1 0 007 2z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="font-black text-gray-900 dark:text-white uppercase tracking-tight">
            {isDentalClinic ? "Resep & Biaya Gigi" : "Terapi Obat & Biaya"}
          </h2>
        </div>
        <button
          type="button"
          onClick={onOpenSelector}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-primary-200 dark:shadow-none uppercase tracking-wider"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Pilih Obat
        </button>
      </div>

      <div className="space-y-3 mb-6">
        {selectedMedicines.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
            <p className="text-sm text-gray-400 font-medium italic">Belum ada obat yang dipilih.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {selectedMedicines.map((item) => (
              <div key={item.medicineId} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-900 dark:border-gray-500 group">
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2">
                  <div>
                    <h4 className="font-black text-gray-900 dark:text-white text-sm uppercase">{item.medicineName}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{item.unit}</p>
                  </div>
                  <div className="mt-2 sm:mt-0 flex items-center gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={item.quantity === 0 ? "" : item.quantity}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        onQuantityChange(item.medicineId, val === "" ? 0 : Number(val));
                      }}
                      className="w-16 px-2 py-1 bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-500 rounded-lg text-xs font-black text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-100 outline-none text-center"
                    />
                    <span className="text-[10px] text-gray-900 dark:text-gray-300 font-black uppercase">Qty</span>
                  </div>
                </div>
                <div className="flex-[2] flex flex-col md:flex-row gap-2">
                  <div className="flex-1 min-w-[120px]">
                    <label className="block text-[9px] font-black text-gray-900 dark:text-gray-300 uppercase mb-0.5 ml-1">Signa</label>
                    <GenericSearchableSelect
                      options={["1 x 1", "2 x 1", "3 x 1", "4 x 1", "3 x 1/2", "3 x 2", "1 x 1/2", "2 x 1/2", "Setiap 8 jam", "Setiap 12 jam", "Setiap 24 jam", "prn / jika perlu", "Lainnya"]}
                      value={item.signa || "3 x 1"}
                      onChange={(val) => onRuleChange(item.medicineId, val, "signa")}
                      placeholder="Pilih Signa..."
                    />
                    {item.signa === "Lainnya" && (
                      <input
                        type="text"
                        value={item.aturanMinum?.split(' - ')[0] || ""}
                        onChange={(e) => {
                           const parts = (item.aturanMinum || "").split(' - ');
                           const rule = e.target.value + (parts[1] ? ` - ${parts[1]}` : "");
                           onRuleChange(item.medicineId, rule, "aturanMinum");
                        }}
                        placeholder="Ketik signa..."
                        className="mt-1 w-full px-2 py-1 bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-500 rounded-lg text-[10px] font-black outline-none"
                      />
                    )}
                  </div>
                  <div className="flex-[2]">
                    <label className="block text-[9px] font-black text-gray-900 dark:text-gray-300 uppercase mb-0.5 ml-1">Aturan Pakai</label>
                    <GenericSearchableSelect
                      options={[
                        "Sesudah makan (p.c)",
                        "Sebelum makan (a.c)",
                        "Saat makan (d.c)",
                        "Sebelum tidur (h.s)",
                        "Pagi hari (m)",
                        "Malam hari (v)",
                        "Teteskan pada mata kanan",
                        "Teteskan pada mata kiri",
                        "Teteskan pada kedua mata",
                        "Oleskan tipis-tipis",
                        "Kumur-kumur",
                        "Dihisap",
                        "Dikunyah",
                        "Lainnya"
                      ]}
                      value={item.aturanPakai || "Sesudah makan (p.c)"}
                      onChange={(val) => onRuleChange(item.medicineId, val, "aturanPakai")}
                      placeholder="Pilih Aturan Pakai..."
                    />
                    {item.aturanPakai === "Lainnya" && (
                      <input
                        type="text"
                        value={item.aturanMinum || ""}
                        onChange={(e) => onRuleChange(item.medicineId, e.target.value, "aturanMinum")}
                        placeholder="Ketik aturan pakai..."
                        className="mt-1 w-full px-2 py-1 bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-500 rounded-lg text-[10px] font-black outline-none"
                      />
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(item.medicineId)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 100 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
        <label className="text-xs font-black text-gray-900 dark:text-gray-200 uppercase tracking-widest pl-1">Total Biaya Pelayanan (Rp)</label>
        <div className="mt-2 relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-900 dark:text-gray-400">Rp</span>
          <input
            type="text"
            value={biayaDisplay}
            onChange={(e) => onBiayaChange(e.target.value)}
            onBlur={onBlurBiaya}
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-500 rounded-2xl text-2xl font-black text-primary-700 dark:text-primary-400 outline-none"
            placeholder="0"
          />
        </div>
        <p className="mt-2 text-[10px] text-gray-400 font-medium italic italic pl-1">Sudah termasuk jasa dokter/bidan dan harga obat-obatan.</p>
      </div>
    </div>
  );
};
