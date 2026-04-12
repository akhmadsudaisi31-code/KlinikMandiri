import { UseFormRegister } from "react-hook-form";

interface LabSectionProps {
  register: UseFormRegister<any>;
}

export function LabSection({ register }: LabSectionProps) {
  return (
    <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-dark-border">
      <div className="flex items-center gap-2 mb-4 border-b border-gray-50 dark:border-gray-800 pb-4">
        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
        </div>
        <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">
          Pemeriksaan Laboratorium Sederhana
        </h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Gula Darah (mg/dL)</label>
          <input
            {...register("gds")}
            type="text"
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-gray-900 rounded-xl outline-none transition-all font-bold text-sm dark:text-white"
            placeholder="GDS/GDP"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Asam Urat (mg/dL)</label>
          <input
            {...register("asamUrat")}
            type="text"
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-gray-900 rounded-xl outline-none transition-all font-bold text-sm dark:text-white"
            placeholder="Asam Urat"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Kolesterol (mg/dL)</label>
          <input
            {...register("kolesterol")}
            type="text"
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-gray-900 rounded-xl outline-none transition-all font-bold text-sm dark:text-white"
            placeholder="Kolesterol"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">HB (g/dL)</label>
          <input
            {...register("hb")}
            type="text"
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-gray-900 rounded-xl outline-none transition-all font-bold text-sm dark:text-white"
            placeholder="Hemoglobin"
          />
        </div>
      </div>
    </div>
  );
}
