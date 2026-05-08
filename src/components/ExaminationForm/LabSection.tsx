import { UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { useState } from "react";
import { api } from "../../api";
import toast from "react-hot-toast";

interface LabSectionProps {
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  showEyeExam?: boolean;
  canUpload?: boolean;
  history?: any[];
}

export function LabSection({ register, setValue, watch, showEyeExam, canUpload, history }: LabSectionProps) {
  const [uploading, setUploading] = useState(false);
  const [showLastLab, setShowLastLab] = useState(false);
  const labResultImages = watch("labResultImages") || [];

  const lastLabEntry = history?.find(h => {
    const ext = h.extendedData_json ? (typeof h.extendedData_json === 'string' ? JSON.parse(h.extendedData_json) : h.extendedData_json) : {};
    return ext.gds || ext.asamUrat || ext.kolesterol || ext.hb || ext.labResultImage || (ext.labResultImages && ext.labResultImages.length > 0);
  });

  const lastLabData = lastLabEntry ? (typeof lastLabEntry.extendedData_json === 'string' ? JSON.parse(lastLabEntry.extendedData_json) : lastLabEntry.extendedData_json) : null;

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 1600;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Gagal kompresi"));
          }, "image/jpeg", 0.7);
        };
      };
      reader.onerror = reject;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const newImages = [...labResultImages];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Kompres gambar sebelum upload
        const compressedBlob = await compressImage(file);
        
        const formData = new FormData();
        const fileName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
        formData.append("file", compressedBlob, fileName);

        const response = await api.post("/upload/lab-result", formData);
        newImages.push(response.path);
      }
      
      setValue("labResultImages", newImages, { shouldDirty: true });
      toast.success(`${files.length} foto berhasil diunggah`);
    } catch (err) {
      toast.error("Gagal mengunggah foto");
      console.error(err);
    } finally {
      setUploading(false);
      // Reset input so the same file can be selected again
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = labResultImages.filter((_: any, i: number) => i !== index);
    setValue("labResultImages", newImages, { shouldDirty: true });
  };

  const getImageUrl = (path: string) => {
    const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');
    return `${baseUrl}/api/upload/lab-result/${path}`;
  };

  return (
    <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-soft border-2 border-gray-900 dark:border-dark-border">
      <div className="flex items-center justify-between mb-4 border-b-2 border-gray-900 dark:border-gray-800 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
          <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">
            Hasil Laboratorium
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {lastLabData && (
            <button
              type="button"
              onClick={() => setShowLastLab(!showLastLab)}
              className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest transition-all flex items-center gap-1.5 border-2 ${showLastLab ? 'bg-primary-600 text-white border-primary-700 shadow-lg' : 'bg-white text-primary-600 border-primary-600 hover:bg-primary-50'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              {showLastLab ? "Tutup Riwayat" : "Riwayat Terakhir"}
            </button>
          )}
          {canUpload && (
            <span className="text-[10px] font-black bg-emerald-600 text-white px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-emerald-500/20">PRO FEATURE</span>
          )}
        </div>
      </div>

      {showLastLab && lastLabData && (
        <div className="mb-6 p-4 bg-primary-50/30 dark:bg-primary-900/10 border-2 border-primary-600 dark:border-primary-900/30 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
           <div className="flex justify-between items-center mb-3">
              <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em]">Hasil Lab Terakhir ({lastLabEntry.date ? new Date(lastLabEntry.date).toLocaleDateString('id-ID') : '-'})</p>
           </div>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {lastLabData.gds && <div><span className="text-[9px] font-black text-gray-900 dark:text-gray-400 block uppercase">GDS</span><span className="text-xs font-black">{lastLabData.gds}</span></div>}
              {lastLabData.asamUrat && <div><span className="text-[9px] font-black text-gray-900 dark:text-gray-400 block uppercase">Asam Urat</span><span className="text-xs font-black">{lastLabData.asamUrat}</span></div>}
              {lastLabData.kolesterol && <div><span className="text-[9px] font-black text-gray-900 dark:text-gray-400 block uppercase">Kolesterol</span><span className="text-xs font-black">{lastLabData.kolesterol}</span></div>}
              {lastLabData.hb && <div><span className="text-[9px] font-black text-gray-900 dark:text-gray-400 block uppercase">HB</span><span className="text-xs font-black">{lastLabData.hb}</span></div>}
           </div>
           
           {(lastLabData.labResultImages?.length > 0 || lastLabData.labResultImage) && (
             <div className="mt-2">
                <p className="text-[9px] font-black text-gray-900 dark:text-gray-400 uppercase mb-2">Foto Lampiran Terakhir:</p>
                <div className="flex flex-wrap gap-2">
                  {(lastLabData.labResultImages || (lastLabData.labResultImage ? [lastLabData.labResultImage] : [])).map((img: string, idx: number) => (
                    <a 
                      key={idx}
                      href={getImageUrl(img)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-block relative group"
                    >
                      <img 
                        src={getImageUrl(img)} 
                        alt={`Last Lab ${idx}`} 
                        className="h-16 w-16 object-cover rounded-lg border-2 border-primary-600 dark:border-primary-800 shadow-sm group-hover:opacity-80 transition-opacity"
                      />
                    </a>
                  ))}
                </div>
             </div>
           )}
        </div>
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Gula Darah (mg/dL)", name: "gds", placeholder: "GDS/GDP" },
            { label: "Asam Urat (mg/dL)", name: "asamUrat", placeholder: "Asam Urat" },
            { label: "Kolesterol (mg/dL)", name: "kolesterol", placeholder: "Kolesterol" },
            { label: "HB (g/dL)", name: "hb", placeholder: "Hemoglobin" },
          ].map(f => (
            <div key={f.name}>
              <label className="block text-[10px] font-black text-gray-900 dark:text-gray-400 uppercase tracking-widest mb-1">{f.label}</label>
              <input
                {...register(f.name as any)}
                type="text"
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-700 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 rounded-xl outline-none transition-all font-black text-sm dark:text-white"
                placeholder={f.placeholder}
              />
            </div>
          ))}
        </div>

        {canUpload && (
          <div className="mt-2 pt-6 border-t-2 border-gray-900 dark:border-gray-800">
             <div className="space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">Lampiran Hasil Lab</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed mt-1">
                            Bisa upload banyak gambar • Format JPG/PNG • Max 2MB per file
                        </p>
                    </div>
                    
                    <label className={`cursor-pointer px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${uploading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 hover:-translate-y-0.5 flex items-center gap-2'}`}>
                        {uploading ? (
                            <>
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Mengunggah...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                </svg>
                                Tambah Foto Lab
                            </>
                        )}
                        <input 
                            type="file" 
                            multiple
                            accept="image/*" 
                            onChange={handleFileChange}
                            disabled={uploading}
                            className="hidden"
                        />
                    </label>
                </div>

                {/* Multiple Images Preview Grid */}
                {labResultImages.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border-2 border-gray-900 dark:border-gray-700 shadow-inner">
                        {labResultImages.map((path: string, index: number) => (
                            <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-gray-900 dark:border-gray-600 bg-white shadow-sm">
                                <img 
                                    src={getImageUrl(path)} 
                                    alt={`Lab ${index}`} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <a 
                                        href={getImageUrl(path)} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="p-1.5 bg-white text-gray-900 rounded-full hover:bg-primary-50 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                        </svg>
                                    </a>
                                    <button 
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
