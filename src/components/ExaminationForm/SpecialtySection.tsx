import React from "react";
import { UseFormRegister, FieldErrors, UseFormWatch } from "react-hook-form";

interface SpecialtySectionProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  watch: UseFormWatch<any>;
  category: string;
}

export const SpecialtySection: React.FC<SpecialtySectionProps> = ({
  register,
  watch,
  category,
}) => {
  const watchIsPersalinan = watch("isPersalinan");
  const watchIsKb = watch("isKb");

  if (category === "Bumil") {
    return (
      <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-soft border-2 border-gray-900 dark:border-gray-500">
        <div className="flex items-center gap-2 mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
          <h2 className="font-black text-gray-900 dark:text-white uppercase tracking-tight">Data Pemeriksaan Ibu Hamil (ANC)</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "HPHT", name: "hpht", type: "date" },
            { label: "HPL (Otomatis)", name: "hpl", type: "date", readOnly: true },
            { label: "GPA", name: "gpa", placeholder: "G... P... A..." },
            { label: "Hamil Ke", name: "hamilKe", type: "number" },
            { label: "Usia Kehamilan", name: "usiaKehamilan", placeholder: "minggu/hari" },
            { label: "Anak Terkecil", name: "anakTerkecil", placeholder: "Umur anak terakhir" },
            { label: "TFU", name: "tfu", unit: "cm" },
            { label: "DJJ", name: "djj", unit: "x/m" },
            { label: "Leopold", name: "leopold", placeholder: "I/II/III/IV" },
            { label: "LILA", name: "lila", unit: "cm" },
            { label: "Status TT", name: "statusTT", placeholder: "T1/T2/..." },
            { label: "Skor", name: "skor", type: "number" },
            { label: "Kunjungan Ke", name: "kunjunganAnc", type: "number" },
            { label: "Hasil USG", name: "usg", className: "md:col-span-2" },
          ].map((f) => (
            <div key={f.name} className={`${f.className || ""} space-y-1.5`}>
              <label className="text-[10px] font-black text-gray-900 dark:text-gray-200 uppercase tracking-widest pl-1">{f.label}</label>
              <div className="relative group">
                <input
                  type={f.type || "text"}
                  {...register(f.name as any)}
                  readOnly={f.readOnly}
                  placeholder={f.placeholder}
                  className={`w-full px-3 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-500 rounded-xl text-sm font-black text-gray-900 dark:text-white focus:border-primary-600 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/20 transition-all ${f.readOnly ? "opacity-70 bg-gray-100" : ""}`}
                />
                {f.unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-900 dark:text-gray-300 group-focus-within:text-primary-600">{f.unit}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Persalinan Section */}
        <div className="mt-8 pt-6 border-t-2 border-gray-900 dark:border-gray-500">
          <div className="flex items-center gap-3 mb-6">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" {...register("isPersalinan")} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Berikan Data Persalinan / Partus</span>
            </label>
          </div>

          {watchIsPersalinan && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in">
              {[
                { label: "Jenis Persalinan", name: "jenisPersalinan" },
                { label: "Penolong", name: "penolong" },
                { label: "Tempat", name: "tempat" },
                { label: "Tgl Partus", name: "tglPartus", type: "date" },
                { label: "Jam Partus", name: "jamPartus", type: "time" },
                { label: "Jenis Kelamin", name: "jenisKelamin", placeholder: "L/P" },
                { label: "AS", name: "as", placeholder: "Apgar Score" },
                { label: "BBL", name: "bbl", unit: "gr" },
                { label: "PB", name: "pb", unit: "cm" },
                { label: "LiKa", name: "lika", unit: "cm" },
                { label: "Vit K", name: "vitK" },
                { label: "HB0", name: "hb0" },
              ].map((f) => (
                <div key={f.name} className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-900 dark:text-gray-200 uppercase tracking-widest pl-1">{f.label}</label>
                  <div className="relative group">
                    <input
                      type={f.type || "text"}
                      {...register(f.name as any)}
                      className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border-2 border-blue-600 dark:border-blue-500 rounded-xl text-sm font-black text-gray-900 dark:text-white focus:border-blue-700 focus:ring-4 focus:ring-blue-100 transition-all"
                    />
                    {f.unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-900 dark:text-gray-300">{f.unit}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (category === "KB") {
    return (
      <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-soft border-2 border-gray-900 dark:border-gray-500">
        <div className="flex items-center gap-3 mb-6">
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" {...register("isKb")} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
            <span className="ml-3 text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Data Pelayanan KB</span>
          </label>
        </div>

        {watchIsKb && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
            {[
              { label: "Jenis Akseptor", name: "akseptor", placeholder: "Baru/Lama/Ganti" },
              { label: "Metode KB", name: "metodeKb", placeholder: "Suntik 1/3 bln, Pil, IUD, Implan..." },
              { label: "Tgl Kembali", name: "tglKembaliKb", type: "date" },
              { label: "Keluhan KB", name: "keluhanKb", className: "md:col-span-3" },
            ].map((f) => (
              <div key={f.name} className={`${f.className || ""} space-y-1.5`}>
                <label className="text-[10px] font-black text-gray-900 dark:text-gray-200 uppercase tracking-widest pl-1">{f.label}</label>
                <input
                  type={f.type || "text"}
                  {...register(f.name as any)}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border-2 border-purple-600 dark:border-purple-500 rounded-xl text-sm font-black text-gray-900 dark:text-white focus:border-purple-700 focus:ring-4 focus:ring-purple-100 transition-all"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Common Specialty Fields (Lansia, Anak, etc)
  if (category === "Lansia" || category === "Anak") {
    return (
      <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-soft border-2 border-gray-900 dark:border-gray-500">
        <h2 className="font-black text-gray-900 dark:text-white uppercase tracking-tight mb-4">Data Spesifik {category}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {category === "Lansia" ? (
            <>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-900 dark:text-gray-200 uppercase tracking-widest pl-1">ADL Score (Kemandirian)</label>
                <input {...register("adlScore")} className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-500 rounded-xl font-black text-gray-900 dark:text-white" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-900 dark:text-gray-200 uppercase tracking-widest pl-1">Status Fungsional</label>
                <input {...register("statusFungsional")} className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-500 rounded-xl font-black text-gray-900 dark:text-white" />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-900 dark:text-gray-200 uppercase tracking-widest pl-1">Lingkar Kepala</label>
                <input {...register("lingkarKepala")} className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-500 rounded-xl font-black text-gray-900 dark:text-white" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-900 dark:text-gray-200 uppercase tracking-widest pl-1">Lingkar Lengan</label>
                <input {...register("lingkarLengan")} className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-500 rounded-xl font-black text-gray-900 dark:text-white" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-900 dark:text-gray-200 uppercase tracking-widest pl-1">Status Imunisasi</label>
                <input {...register("statusImunisasi")} className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-500 rounded-xl font-black text-gray-900 dark:text-white" />
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
};
