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
      <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-soft border-2 border-gray-900 dark:border-dark-border">
        <div className="flex items-center gap-2 mb-4">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 text-orange-600 font-black text-sm">S</span>
          <h2 className="font-black text-gray-900 dark:text-white uppercase tracking-tight">Subjective</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-900 dark:text-gray-200 uppercase tracking-widest pl-1">Keluhan Utama <span className="text-red-600">*</span></label>
            <textarea
              {...register("keluhanUtama")}
              rows={3}
              className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 rounded-xl focus:ring-4 transition-all resize-none ${errors.keluhanUtama ? "border-red-500 focus:ring-red-100" : "border-gray-900 dark:border-gray-500 focus:border-primary-600 focus:ring-primary-100 dark:focus:ring-primary-900/20"}`}
            />
            {errors.keluhanUtama && <p className="text-red-600 text-[10px] font-black uppercase mt-1">{errors.keluhanUtama.message as string}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-900 dark:text-gray-200 uppercase tracking-widest pl-1">Riwayat Penyakit Sekarang</label>
            <textarea
              {...register("riwayatPenyakitSekarang")}
              rows={3}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-500 rounded-xl focus:border-primary-600 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/20 transition-all resize-none"
            />
          </div>
        </div>
      </div>

      {/* O: OBJECTIVE */}
      <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-soft border-2 border-gray-900 dark:border-dark-border">
        <div className="flex items-center gap-2 mb-4">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600 font-black text-sm">O</span>
          <h2 className="font-black text-gray-900 dark:text-white uppercase tracking-tight">Objective</h2>
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
              <label className="text-[10px] font-black text-gray-900 dark:text-gray-200 uppercase tracking-widest pl-1">{field.label}</label>
              <div className="relative group">
                <input
                  type="text"
                  {...register(field.name as any)}
                  className="w-full pl-3 pr-8 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-500 rounded-xl text-sm font-black text-gray-900 dark:text-white focus:border-primary-600 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/20 transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-900 dark:text-gray-300 group-focus-within:text-primary-600">{field.unit}</span>
              </div>
            </div>
          ))}
        </div>
        {/* PHYSICAL EXAM SYSTEMS CHECKLIST */}
        <div className="mt-6 border-t border-gray-50 dark:border-gray-800 pt-6">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4">Pemeriksaan Fisik Per Sistem</label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
            {[
              { id: "showPhysicHead", label: "Kepala/Leher" },
              { id: "showPhysicThorax", label: "Thorax" },
              { id: "showPhysicAbdomen", label: "Abdomen" },
              { id: "showPhysicExtremities", label: "Ekstremitas" },
              { id: "showPhysicSkin", label: "Kulit" },
              { id: "showPhysicNeurology", label: "Neurologi" },
            ].map(sys => (
              <label key={sys.id} className={`flex items-center gap-2 p-2 rounded-xl border-2 transition-all cursor-pointer ${watch(sys.id) ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/10' : 'border-gray-900 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                <input type="checkbox" {...register(sys.id)} className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500" />
                <span className={`text-[10px] font-black uppercase ${watch(sys.id) ? 'text-primary-900 dark:text-primary-100' : 'text-gray-900 dark:text-gray-200'}`}>{sys.label}</span>
              </label>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { id: "showPhysicHead", name: "physicHead", label: "Kepala & Leher" },
              { id: "showPhysicThorax", name: "physicThorax", label: "Thorax (Dada)" },
              { id: "showPhysicAbdomen", name: "physicAbdomen", label: "Abdomen (Perut)" },
              { id: "showPhysicExtremities", name: "physicExtremities", label: "Ekstremitas" },
              { id: "showPhysicSkin", name: "physicSkin", label: "Kulit / Integumen" },
              { id: "showPhysicNeurology", name: "physicNeurology", label: "Neurologi" },
            ].map(sys => watch(sys.id) && (
              <div key={sys.name} className="space-y-1.5 animate-in fade-in zoom-in-95 duration-200">
                <label className="text-[10px] font-black text-gray-900 dark:text-gray-200 uppercase tracking-widest pl-1">
                  {sys.label} <span className="text-red-600">*</span>
                </label>
                <textarea 
                  {...register(sys.name as any)}
                  rows={2}
                  className={`w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 rounded-xl text-xs font-black text-gray-900 dark:text-white transition-all outline-none resize-none ${errors[sys.name] ? "border-red-500 focus:ring-4 focus:ring-red-100" : "border-gray-900 dark:border-gray-500 focus:border-primary-600"}`}
                />
                {errors[sys.name] && <p className="text-red-600 text-[9px] font-black uppercase pl-1">{errors[sys.name]?.message as string}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 border-t border-gray-50 dark:border-gray-800 pt-6">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input 
                type="checkbox" 
                {...register("showEyeExam")} 
                className="peer sr-only" 
              />
              <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-indigo-500 transition-all"></div>
              <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-all peer-checked:left-6"></div>
            </div>
            <span className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest group-hover:text-indigo-500 transition-colors">
              Pemeriksaan Mata
            </span>
          </label>
        </div>

        {watch("showEyeExam") && (
          <div className="mt-4 p-5 bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-900 dark:border-gray-500 space-y-6 shadow-xl shadow-gray-200/50 dark:shadow-none animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Visus & Tonometri */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-widest border-b-2 border-gray-900 dark:border-gray-500 pb-1 flex items-center gap-2">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                    Visus
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-900 dark:text-gray-300 uppercase pl-1">VOD (Kanan)</label>
                    <input {...register("visusVOD")} placeholder="Contoh: 6/6" className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-500 rounded-xl text-xs font-black text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-900 dark:text-gray-300 uppercase pl-1">VOS (Kiri)</label>
                    <input {...register("visusVOS")} placeholder="Contoh: 6/6" className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-500 rounded-xl text-xs font-black text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all" />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-widest border-b-2 border-gray-900 dark:border-gray-500 pb-1 flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    Tekanan Intraokular (TIO)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-900 dark:text-gray-300 uppercase pl-1">TOD (Kanan)</label>
                    <input {...register("tod")} placeholder="mmHg" className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-500 rounded-xl text-xs font-black text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-900 dark:text-gray-300 uppercase pl-1">TOS (Kiri)</label>
                    <input {...register("tos")} placeholder="mmHg" className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-500 rounded-xl text-xs font-black text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all" />
                  </div>
                </div>
              </div>
            </div>

            {/* Segmen Anterior */}
            <div className="space-y-4">
               <h4 className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-widest border-b-2 border-gray-900 dark:border-gray-500 pb-1 flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    Segmen Anterior & Posterior
               </h4>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Palpebra", name: "eyePalpebra" },
                    { label: "Konjungtiva", name: "eyeConjunctiva" },
                    { label: "Sklera", name: "eyeSclera" },
                    { label: "Kornea", name: "eyeCornea" },
                    { label: "BMD", name: "eyeBMD" },
                    { label: "Iris / Pupil", name: "eyeIrisPupil" },
                    { label: "Lensa", name: "eyeLens" },
                    { label: "Fundus", name: "eyeFundus" },
                  ].map(f => (
                    <div key={f.name} className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-900 dark:text-gray-300 uppercase pl-1">{f.label}</label>
                      <input {...register(f.name as any)} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-500 rounded-xl text-xs font-black text-gray-900 dark:text-white outline-none focus:border-indigo-500 transition-all" />
                    </div>
                  ))}
               </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-900 dark:text-gray-300 uppercase tracking-widest pl-1">Catatan Tambahan Mata</label>
              <textarea 
                {...register("pemeriksaanMataInternal")} 
                rows={2}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-500 rounded-2xl text-xs font-black text-gray-900 dark:text-white focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 transition-all resize-none" 
              />
            </div>
          </div>
        )}

        {/* LEGACY PHYSICAL EXAM (Still show if not using specific systems) */}
        {!Object.keys(watch()).some(k => k.startsWith("showPhysic") && watch(k)) && !watch("showEyeExam") && (
          <div className="space-y-2 mt-4">
            <label className="text-xs font-black text-gray-900 dark:text-gray-200 uppercase tracking-widest pl-1">Pemeriksaan Fisik</label>
            <textarea
              {...register("pemeriksaanFisik")}
              rows={2}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-500 rounded-xl focus:border-primary-600 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/20 transition-all resize-none font-black text-gray-900 dark:text-white"
            />
          </div>
        )}

        {isDentalClinic && odontogram && setOdontogram && (
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 space-y-8">
            {/* 0. Basic Dental Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50/30 dark:bg-blue-900/10 p-4 rounded-xl border-2 border-gray-900 dark:border-blue-900/30">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Jenis Kunjungan</label>
                  <select {...register("dentalVisitType")} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-700 rounded-xl text-sm font-bold focus:border-primary-500 outline-none">
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
                    <label className="text-[10px] font-black text-gray-900 dark:text-gray-200 uppercase tracking-widest pl-1">{f.label}</label>
                    <textarea 
                      {...register(f.name as any)} 
                      rows={2}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-500 rounded-xl text-sm font-black text-gray-900 dark:text-white focus:border-primary-600 outline-none transition-all resize-none"
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
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-500 rounded-xl text-sm font-black text-gray-900 dark:text-white focus:border-primary-600 outline-none transition-all resize-none"
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
                      <label className="text-[10px] font-black text-gray-900 dark:text-gray-200 uppercase tracking-widest pl-1">{f.label}</label>
                      <input {...register(f.name as any)} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-500 rounded-xl text-xs font-black text-gray-900 dark:text-white" placeholder={f.placeholder} />
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
              <div className="bg-gray-50 dark:bg-gray-800/30 p-6 rounded-2xl border-2 border-gray-900 dark:border-gray-700 shadow-inner">
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
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-700 rounded-xl text-xs font-bold focus:border-primary-500 transition-all"
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
      <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-soft border-2 border-gray-900 dark:border-dark-border">
        <div className="flex items-center gap-2 mb-4">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 text-purple-600 font-black text-sm">A</span>
          <h2 className="font-black text-gray-900 dark:text-white uppercase tracking-tight">Assessment</h2>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-900 dark:text-gray-200 uppercase tracking-widest pl-1">Diagnosa Kerja <span className="text-red-600">*</span></label>
            <input
              type="text"
              {...register("diagnosa")}
              className={`w-full px-4 py-3.5 bg-white dark:bg-gray-800 border-2 rounded-xl font-black text-gray-900 dark:text-white focus:ring-4 transition-all ${errors.diagnosa ? "border-red-500 focus:ring-red-100" : "border-gray-900 dark:border-gray-500 focus:border-primary-600 focus:ring-primary-100 dark:focus:ring-primary-900/20"}`}
            />
            {errors.diagnosa && <p className="text-red-600 text-[10px] font-black uppercase mt-1">{errors.diagnosa.message as string}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-900 dark:text-gray-200 uppercase tracking-widest pl-1">ICD-10 Code</label>
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
      <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-soft border-2 border-gray-900 dark:border-dark-border">
        <div className="flex items-center gap-2 mb-4">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 text-green-600 font-black text-sm">P</span>
          <h2 className="font-black text-gray-900 dark:text-white uppercase tracking-tight">Plan</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-900 dark:text-gray-200 uppercase tracking-widest pl-1">Tindakan / Prosedur</label>
            <textarea
              {...register("tindakan")}
              rows={3}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-500 rounded-xl focus:border-primary-600 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/20 transition-all resize-none font-black text-gray-900 dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-900 dark:text-gray-200 uppercase tracking-widest pl-1">Edukasi & Konseling</label>
            <textarea
              {...register("edukasi")}
              rows={3}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-500 rounded-xl focus:border-primary-600 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/20 transition-all resize-none font-black text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <label className="text-xs font-black text-gray-900 dark:text-gray-200 uppercase tracking-widest pl-1">Rencana Tindak Lanjut</label>
          <input
            type="text"
            {...register("rencanaTindakLanjut")}
            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-500 rounded-xl focus:border-primary-600 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/20 transition-all font-black text-gray-900 dark:text-white"
          />
        </div>
      </div>
    </div>
  );
};
