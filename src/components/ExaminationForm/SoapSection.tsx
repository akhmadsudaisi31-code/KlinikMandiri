import React from "react";
import { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { Icd10Autocomplete } from "../Icd10Autocomplete";
import { Icd10Item } from "../../data/icd10";
import { OdontogramEditor } from "../OdontogramEditor";

interface SoapSectionProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  icd10Items: Icd10Item[];
  icd10Placeholder: string;
  isDentalClinic?: boolean;
  odontogram?: any;
  setOdontogram?: (val: any) => void;
}

export const SoapSection: React.FC<SoapSectionProps> = ({
  register,
  errors,
  setValue,
  watch,
  icd10Items,
  icd10Placeholder,
  isDentalClinic,
  odontogram,
  setOdontogram,
}) => {
  const handleSelectIcd10 = (item: { code: string; title: string }) => {
    setValue("icd10", item.code, { shouldDirty: true, shouldValidate: true });
    const currentDiagnosis = watch("diagnosa");
    if (!currentDiagnosis || currentDiagnosis.trim() === "") {
      setValue("diagnosa", item.title, { shouldDirty: true, shouldValidate: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* S: SUBJECTIVE */}
      <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-dark-border">
        <div className="flex items-center gap-2 mb-4">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 text-orange-600 font-black text-sm">S</span>
          <h2 className="font-black text-gray-900 dark:text-white uppercase tracking-tight">Subjective (Keluhan)</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Keluhan Utama</label>
            <textarea
              {...register("keluhanUtama")}
              rows={3}
              className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 rounded-xl focus:ring-4 transition-all resize-none ${errors.keluhanUtama ? "border-red-300 focus:ring-red-100" : "border-gray-100 dark:border-gray-700 focus:border-primary-500 focus:ring-primary-100 dark:focus:ring-primary-900/20"}`}
              placeholder="Contoh: Panas sejak 3 hari yang lalu..."
            />
            {errors.keluhanUtama && <p className="text-red-500 text-[10px] font-bold uppercase mt-1">{errors.keluhanUtama.message as string}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Riwayat Penyakit Sekarang</label>
            <textarea
              {...register("riwayatPenyakitSekarang")}
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/20 transition-all resize-none"
              placeholder="Detail tambahan perjalanan penyakit..."
            />
          </div>
        </div>
      </div>

      {/* O: OBJECTIVE */}
      <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-dark-border">
        <div className="flex items-center gap-2 mb-4">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600 font-black text-sm">O</span>
          <h2 className="font-black text-gray-900 dark:text-white uppercase tracking-tight">Objective (TTV & Fisik)</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          {[
            { label: "Tensi", name: "tensi", unit: "mmHg" },
            { label: "Nadi", name: "nadi", unit: "x/m" },
            { label: "Suhu", name: "suhu", unit: "°C" },
            { label: "Resp", name: "respirasi", unit: "x/m" },
            { label: "BB", name: "bb", unit: "kg" },
            { label: "TB", name: "tb", unit: "cm" },
            { label: "SpO2", name: "spo2", unit: "%" },
          ].map((field) => (
            <div key={field.name} className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">{field.label}</label>
              <div className="relative group">
                <input
                  type="text"
                  {...register(field.name as any)}
                  className="w-full pl-3 pr-8 py-2.5 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl text-sm font-bold focus:border-primary-500 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/20 transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 group-focus-within:text-primary-500">{field.unit}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Pemeriksaan Fisik / Status Lokalis</label>
          <textarea
            {...register("pemeriksaanFisik")}
            rows={2}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/20 transition-all resize-none"
            placeholder="Hasil pemeriksaan fisik head-to-toe..."
          />
        </div>

        {isDentalClinic && odontogram && setOdontogram && (
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 space-y-8">
            {/* 0. Basic Dental Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50/30 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Jenis Kunjungan</label>
                  <select {...register("dentalVisitType")} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl text-sm font-bold focus:border-primary-500 outline-none">
                    <option value="Baru">Kunjungan Baru</option>
                    <option value="Lama">Kunjungan Lama</option>
                  </select>
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Skala Nyeri (0-10)</label>
                  <input type="range" min="0" max="10" {...register("dentalPainScale")} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600" />
                  <div className="flex justify-between text-[10px] font-bold text-gray-400">
                    <span>Nyaman</span>
                    <span>Nyeri Berat</span>
                  </div>
               </div>
            </div>

            {/* 1. Dental History */}
            <div className="space-y-4">
              <label className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Riwayat Dental & Kebiasaan
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "Riwayat Medis Khusus", name: "dentalMedicalHistory", placeholder: "Alergi obat, penyakit sistemik..." },
                  { label: "Kebiasaan Buruk", name: "dentalHabits", placeholder: "Bruksism, merokok, dll..." },
                  { label: "Riwayat Perawatan Gigi", name: "dentalTreatmentHistory", placeholder: "Pencabutan, tambalan sebelumnya..." },
                ].map((f) => (
                  <div key={f.name} className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">{f.label}</label>
                    <textarea 
                      {...register(f.name as any)} 
                      rows={2}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl text-sm font-bold focus:border-primary-500 outline-none transition-all resize-none"
                      placeholder={f.placeholder}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Extra-oral & Intra-oral */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Pemeriksaan Ekstraoral
                </label>
                <textarea 
                  {...register("dentalExtraOral")}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl text-sm font-bold focus:border-primary-500 outline-none transition-all resize-none"
                  placeholder="Muka, Bibir, Kelenjar Limfe, TMJ..."
                />
              </div>
              <div className="space-y-4">
                <label className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Pemeriksaan Intraoral & Higiene
                </label>
                <div className="grid grid-cols-2 gap-3">
                   {[
                     { label: "Oklusi", name: "dentalOcclusion", placeholder: "Normal/Edge to edge..." },
                     { label: "Oral Hygiene", name: "dentalOralHygiene", placeholder: "Baik/Sedang/Buruk" },
                     { label: "Gingiva", name: "dentalGingiva", placeholder: "Normal/Radang..." },
                     { label: "Kalkulus", name: "dentalCalculus", placeholder: "Ada/Tidak..." },
                   ].map(f => (
                    <div key={f.name} className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">{f.label}</label>
                      <input {...register(f.name as any)} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl text-xs font-bold" placeholder={f.placeholder} />
                    </div>
                   ))}
                </div>
              </div>
            </div>

            {/* 3. Odontogram Chart */}
            <div className="space-y-4">
              <label className="text-xs font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest block flex items-center gap-2 underline decoration-2 underline-offset-4">
                <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></span>
                Diagram Odontogram (Dewasa)
              </label>
              <div className="bg-gray-50 dark:bg-gray-800/30 p-6 rounded-2xl border-2 border-gray-100 dark:border-gray-700 shadow-inner">
                <OdontogramEditor 
                  teeth={odontogram}
                  onChange={setOdontogram}
                />
              </div>
            </div>

            {/* 4. Clinical Assessment Details */}
            <div className="space-y-4">
              <label className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Clinical Assessment (Specific Tooth)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: "Palpasi", name: "dentalPalpation", placeholder: "+ / -" },
                  { label: "Perkusi", name: "dentalPercussion", placeholder: "+ / -" },
                  { label: "Mobility", name: "dentalMobility", placeholder: "Grade 1/2/3" },
                  { label: "Pocket Depth", name: "dentalPocketDepth", unit: "mm" },
                  { label: "BOP", name: "dentalBleedingOnProbing", placeholder: "+ / -" },
                ].map((f) => (
                  <div key={f.name} className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">{f.label}</label>
                    <div className="relative group">
                      <input
                        type="text"
                        {...register(f.name as any)}
                        placeholder={f.placeholder}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl text-xs font-bold focus:border-primary-500 transition-all"
                      />
                      {f.unit && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-gray-400">{f.unit}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* A: ASSESSMENT */}
      <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-dark-border">
        <div className="flex items-center gap-2 mb-4">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 text-purple-600 font-black text-sm">A</span>
          <h2 className="font-black text-gray-900 dark:text-white uppercase tracking-tight">Assessment (Diagnosa)</h2>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Diagnosa Kerja</label>
            <input
              type="text"
              {...register("diagnosa")}
              className={`w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border-2 rounded-xl font-bold focus:ring-4 transition-all ${errors.diagnosa ? "border-red-300 focus:ring-red-100" : "border-gray-100 dark:border-gray-700 focus:border-primary-500 focus:ring-primary-100 dark:focus:ring-primary-900/20"}`}
              placeholder="Contoh: Pharyngitis Akut"
            />
            {errors.diagnosa && <p className="text-red-500 text-[10px] font-bold uppercase mt-1">{errors.diagnosa.message as string}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">ICD-10 Code</label>
            <div className="relative">
              <Icd10Autocomplete
                items={icd10Items}
                onSelect={handleSelectIcd10}
                placeholder={icd10Placeholder}
                value={watch("icd10") || ""}
                onChange={(val) => setValue("icd10", val)}
              />
            </div>
            <p className="text-[10px] text-gray-400 font-medium italic mt-1">Cari kode ICD-10 untuk standarisasi laporan BPJS/SatuSehat.</p>
          </div>
        </div>
      </div>

      {/* P: PLAN */}
      <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-dark-border">
        <div className="flex items-center gap-2 mb-4">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 text-green-600 font-black text-sm">P</span>
          <h2 className="font-black text-gray-900 dark:text-white uppercase tracking-tight">Plan (Terapy & Edukasi)</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Tindakan / Prosedur</label>
            <textarea
              {...register("tindakan")}
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/20 transition-all resize-none"
              placeholder="Tindakan medis yang dilakukan..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Edukasi & Konseling</label>
            <textarea
              {...register("edukasi")}
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/20 transition-all resize-none"
              placeholder="Saran perawatan di rumah..."
            />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Rencana Tindak Lanjut</label>
          <input
            type="text"
            {...register("rencanaTindakLanjut")}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/20 transition-all"
            placeholder="Contoh: Kontrol 3 hari lagi jika demam tidak turun"
          />
        </div>
      </div>
    </div>
  );
};
