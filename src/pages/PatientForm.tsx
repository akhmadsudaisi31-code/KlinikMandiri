import { useEffect, useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { PatientFormData, GENDERS, CATEGORIES, POLI_OPTIONS } from '../types';
import toast from 'react-hot-toast';

const schema = z.object({
  manualRm: z.string().optional(),
  name: z.string().min(2, 'Nama wajib diisi'),
  gender: z.enum(GENDERS, { required_error: 'Jenis kelamin wajib diisi' }),
  category: z.enum(CATEGORIES, { required_error: 'Kategori wajib diisi' }),
  address: z.string().min(5, 'Alamat wajib diisi'),
  dob: z.string().optional().nullable(),
  ageYears: z.string().optional(),
  ageMonths: z.string().optional(),
  poli: z.enum(POLI_OPTIONS, { required_error: 'Poli wajib diisi' }),
}).refine(data => data.ageYears || data.ageMonths || data.dob, {
  message: 'Isi Umur (Tahun/Bulan) atau Tanggal Lahir',
  path: ['ageYears'],
});

interface ExtendedPatientFormData extends PatientFormData {
  manualRm?: string;
}

function PatientForm() {
  const { id: patientId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!patientId;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(isEditMode);
  const [rmMode, setRmMode] = useState<'auto' | 'manual' | 'none'>(isEditMode ? 'manual' : 'auto');
  const [nextRmPreview, setNextRmPreview] = useState<string>('');
  const { user } = useAuth();

  const previewNextRmNumber = async () => {
      try {
          const res = await api.get('/patients/next-rm');
          return typeof res === 'string' ? res : (res?.rm || '-');
      } catch {
          return '-';
      }
  };
  const getNextRmNumber = previewNextRmNumber;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<ExtendedPatientFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      namaSuami: '',
      address: '',
      dob: '',
      ageYears: '',
      ageMonths: '',
      manualRm: '',
      poli: 'Umum' as const,
    }
  });

  const dobValue = watch('dob');
  useEffect(() => {
    if (dobValue) {
      try {
        const birthDate = new Date(dobValue);
        const today = new Date();
        let years = today.getFullYear() - birthDate.getFullYear();
        let months = today.getMonth() - birthDate.getMonth();
        if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
          years--;
          months += 12;
        }
        setValue('ageYears', String(years));
        setValue('ageMonths', String(months));
      } catch (e) { /* abaikan */ }
    }
  }, [dobValue, setValue]);

  useEffect(() => {
    if (!isEditMode && rmMode === 'auto') {
      previewNextRmNumber().then(setNextRmPreview);
    }
  }, [isEditMode, rmMode]);

  useEffect(() => {
    if (isEditMode && patientId) {
      setIsFetchingData(true);
      setRmMode('manual'); // Default to manual/display for edit mode

      const fetchPatient = async () => {
        try {
          const data = await api.get(`/patients/${patientId}`);
          if (data) {
            setValue('manualRm', data.rm);
            setValue('name', data.name);
            setValue('namaSuami', data.namaSuami || '');
            setValue('gender', data.gender);
            setValue('category', data.category);
            setValue('address', data.address);
            setValue('dob', data.dob || '');
            setValue('ageYears', data.ageYears ? String(data.ageYears) : '');
            setValue('ageMonths', data.ageMonths ? String(data.ageMonths) : '');
            setValue('poli', data.poli || 'Umum');
          } else {
            toast.error('Data pasien tidak ditemukan.');
            navigate('/');
          }
        } catch (error) {
          toast.error('Gagal mengambil data pasien.');
        } finally {
          setIsFetchingData(false);
        }
      };
      fetchPatient();
    }
  }, [isEditMode, patientId, setValue, navigate]);

  const calculateAge = (yearsStr: string | undefined, monthsStr: string | undefined) => {
    const years = parseInt(yearsStr || '0', 10);
    const months = parseInt(monthsStr || '0', 10);
    const totalMonths = (years * 12) + months;
    const finalYears = Math.floor(totalMonths / 12);
    const finalMonths = totalMonths % 12;

    let ageDisplay = "";
    if (finalYears > 0) ageDisplay += `${finalYears} thn `;
    if (finalMonths > 0) ageDisplay += `${finalMonths} bln`;
    if (!ageDisplay) ageDisplay = yearsStr === '0' ? "0 bln" : "N/A";

    return { ageYears: finalYears, ageMonths: finalMonths, ageDisplay: ageDisplay.trim() };
  };

  const onSubmit: SubmitHandler<ExtendedPatientFormData> = async (data) => {
    setIsLoading(true);
    if (!user) {
      toast.error('Anda harus login.');
      setIsLoading(false);
      return;
    }

    if (rmMode === 'manual' && !data.manualRm) {
      toast.error("Nomor RM Wajib diisi jika mode Manual dipilih!");
      setIsLoading(false);
      return;
    }

    const { ageYears, ageMonths, ageDisplay } = calculateAge(data.ageYears, data.ageMonths);
    const now = new Date().toISOString();

    try {
      let finalRm = data.manualRm || '';

      if (!isEditMode) {
        if (rmMode === 'auto') {
            finalRm = await getNextRmNumber();
        } else if (rmMode === 'none') {
             // Pastikan RM diset ke '-' jika mode None
            finalRm = '-';
        }
      }

      // Fallback jika RM kosong di mode No RM
      if (rmMode === 'none' && !finalRm) finalRm = '-';

      const commonData = {
        clinicId: user.uid, // ADDED: SaaS Multi-tenancy
        name: data.name,
        namaSuami: data.namaSuami,
        gender: data.gender,
        category: data.category,
        address: data.address,
        dob: data.dob ? data.dob : null,
        ageYears,
        ageMonths,
        ageDisplay,
        poli: data.poli,
        updatedAt: now,
        createdBy: user.uid,
      };

      if (isEditMode && patientId) {
        // UPDATE
        await api.put(`/patients/${patientId}`, {
          ...commonData,
          rm: finalRm
        });

        // KIRIM NOTIFIKASI JIKA UPDATE KE POLI PEMERIKSAAN
        if (data.poli === 'Pemeriksaan') {
            try {
                await api.post('/notifications', {
                    type: 'NEW_PATIENT',
                    patientId: patientId,
                    patientName: data.name,
                    message: `Update Pasien: ${data.name} masuk antrian pemeriksaan.`,
                    read: false,
                    createdAt: new Date().toISOString(),
                    toRole: 'pemeriksa',
                    clinicId: user.uid
                });
            } catch (notifError) {
                console.error("Gagal mengirim notifikasi update:", notifError);
            }
        }
      } else {
        // CREATE
        const patientData = {
          rm: finalRm,
          ...commonData,
          createdAt: now,
        };
        const docRef = await api.post('/patients', patientData);
        
        // KIRIM NOTIFIKASI JIKA MASUK POLI PEMERIKSAAN
        if (data.poli === 'Pemeriksaan') {
            try {
                await api.post('/notifications', {
                    type: 'NEW_PATIENT',
                    patientId: docRef?.id || Date.now().toString(),
                    patientName: data.name,
                    message: `Pasien Baru: ${data.name} masuk antrian pemeriksaan.`,
                    read: false,
                    createdAt: new Date().toISOString(),
                    toRole: 'pemeriksa',
                    clinicId: user.uid
                });
            } catch (notifError) {
                console.error("Gagal mengirim notifikasi creation:", notifError);
            }
        }
        
        // Set ID for redirect logic below if needed
        (window as any)._lastId = docRef?.id;
      }

      // REDIRECT LOGIC
      const targetId = isEditMode ? patientId : (window as any)._lastId;
      if (data.poli === 'Pemeriksaan' && targetId) {
          navigate(`/pemeriksaan/${targetId}`);
      } else {
          navigate('/pasien');
      }

    } catch (error) {
      console.error("Error saving:", error);
      toast.error('Gagal menyimpan data. Cek koneksi atau izin.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingData) return <p className="text-center text-gray-600 dark:text-gray-400 p-10">Memuat data...</p>;

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <div className="bg-gradient-to-r from-primary-50 to-white dark:from-dark-surface dark:to-dark-bg p-6 rounded-t-2xl border border-primary-100 dark:border-dark-border border-b-0">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Data Pasien' : 'Registrasi Pasien Baru'}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Lengkapi formulir di bawah ini dengan benar.</p>
      </div>

      <div className="bg-white dark:bg-dark-surface p-6 md:p-8 rounded-b-2xl shadow-soft dark:shadow-none border border-primary-100 dark:border-dark-border border-t-0 transition-colors">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* --- BAGIAN PENGATURAN NO RM --- */}
          <div className="bg-blue-50/50 dark:bg-blue-900/20 p-5 rounded-xl border border-blue-100 dark:border-blue-800">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Nomor Rekam Medis (RM)</label>

              {!isEditMode && (
                <div className="flex p-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setRmMode('auto')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${rmMode === 'auto' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                  >
                    Otomatis
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                        setRmMode('manual');
                        setValue('manualRm', '');
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${rmMode === 'manual' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                  >
                    Manual
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                        setRmMode('none');
                        setValue('manualRm', '');
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${rmMode === 'none' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                  >
                    Tanpa RM
                  </button>
                </div>
              )}
            </div>

            {rmMode === 'auto' && (
              <div className="flex items-center gap-3">
                <div className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 italic flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  Akan dibuat otomatis ({nextRmPreview || '...'})
                </div>
              </div>
            )}
            
            {rmMode === 'manual' && (
              <div>
                <input
                  {...register('manualRm')}
                  placeholder="Ketik Nomor RM..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-bold tracking-wide text-gray-900"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-1 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                  Masukkan nomor RM secara manual
                </p>
              </div>
            )}

            {rmMode === 'none' && (
               <div className="flex items-center gap-3">
                <div className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 italic flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                  Pasien akan didaftarkan tanpa Nomor RM
                </div>
              </div>
            )}
          </div>

          {/* Nama and Suami Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nama Lengkap</label>
              <input
                {...register('name')}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                placeholder="Masukkan nama pasien"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nama Suami / Penanggung Jawab</label>
              <input
                {...register('namaSuami')}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-medium text-gray-800 placeholder-gray-400"
                placeholder="Khusus Bumil/Anak (Opsional)"
              />
            </div>
          </div>

          {/* Kategori & Gender Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Kategori</label>
              <div className="relative">
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <select {...field} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white">
                      <option value="">-- Pilih Kategori --</option>
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  )}
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Jenis Kelamin</label>
              <div className="relative">
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <select {...field} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white">
                      <option value="">-- Pilih Gender --</option>
                      {GENDERS.map(gen => <option key={gen} value={gen}>{gen}</option>)}
                    </select>
                  )}
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
              {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>}
            </div>
          </div>

          {/* Alamat */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Alamat Lengkap</label>
            <textarea
              {...register('address')}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              placeholder="Jalan, RT/RW, Desa..."
            />
            {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>}
          </div>

          {/* Poli */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Poli Tujuan</label>
            <div className="relative">
              <Controller
                name="poli"
                control={control}
                render={({ field }) => (
                  <select {...field} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white">
                    {POLI_OPTIONS.map(poli => <option key={poli} value={poli}>{poli}</option>)}
                  </select>
                )}
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
            {errors.poli && <p className="mt-1 text-sm text-red-600">{errors.poli.message}</p>}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-1">Pilih "Pemeriksaan" jika pasien akan langsung diperiksa</p>
          </div>

          {/* Umur & Tgl Lahir */}
          <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Kelahiran & Umur
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Tanggal Lahir</label>
                <input
                  type="date"
                  {...register('dob')}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-[10px] text-gray-400 mt-1 ml-1">Otomatis hitung umur jika diisi</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Tahun</label>
                  <input
                    type="number"
                    {...register('ageYears')}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Bulan</label>
                  <input
                    type="number"
                    {...register('ageMonths')}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>
            {errors.ageYears && <p className="mt-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/30 px-3 py-2 rounded-lg border border-red-100 dark:border-red-800">{errors.ageYears.message}</p>}
          </div>

          {/* Tombol Aksi */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full sm:w-auto px-6 py-3 font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full sm:w-auto px-8 py-3 font-bold text-white bg-primary-600 rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-200 dark:shadow-none hover:shadow-primary-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
            >
              {isSubmitting || isLoading ? 'Menyimpan...' : 'SIMPAN & LANJUT'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default PatientForm;