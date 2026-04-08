import React from "react";
import { MedicineItem } from "../../types";

interface MedicineSectionProps {
  selectedMedicines: MedicineItem[];
  onRemove: (id: string) => void;
  onRuleChange: (id: string, rule: string) => void;
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
              <div key={item.medicineId} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 group">
                <div className="flex-1">
                  <h4 className="font-black text-gray-900 dark:text-white text-sm uppercase">{item.medicineName}</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">{item.quantity} {item.unit}</p>
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={item.aturanMinum || ""}
                    onChange={(e) => onRuleChange(item.medicineId, e.target.value)}
                    placeholder="Aturan minum (mis: 3x1 sesudah makan)"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold focus:ring-2 focus:ring-primary-100 outline-none"
                  />
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
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Total Biaya Pelayanan (Rp)</label>
        <div className="mt-2 relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">Rp</span>
          <input
            type="text"
            value={biayaDisplay}
            onChange={(e) => onBiayaChange(e.target.value)}
            onBlur={onBlurBiaya}
            className="w-full pl-12 pr-4 py-4 bg-primary-50/30 dark:bg-primary-900/10 border-2 border-primary-100 dark:border-primary-900/30 rounded-2xl text-xl font-black text-primary-700 dark:text-primary-400 focus:ring-0 outline-none"
            placeholder="0"
          />
        </div>
        <p className="mt-2 text-[10px] text-gray-400 font-medium italic italic pl-1">Sudah termasuk jasa dokter/bidan dan harga obat-obatan.</p>
      </div>
    </div>
  );
};
