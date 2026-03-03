import { useEffect, useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { MEDICINE_UNITS, MedicineUnit } from '../types';
import toast from 'react-hot-toast';

const schema = z.object({
    name: z.string().min(2, 'Nama obat wajib diisi'),
    unit: z.enum(MEDICINE_UNITS, { required_error: 'Satuan wajib diisi' }),
});

type MedicineFormData = {
    name: string;
    unit: MedicineUnit;
};

function MedicineForm() {
    const { id: medicineId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isEditMode = !!medicineId;

    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingData, setIsFetchingData] = useState(isEditMode);

    const {
        register,
        handleSubmit,
        control,
        setValue,
        formState: { errors, isSubmitting }
    } = useForm<MedicineFormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: '',
            unit: '' as MedicineUnit,
        }
    });

    useEffect(() => {
        if (isEditMode && medicineId) {
            setIsFetchingData(true);

            const fetchMedicine = async () => {
                try {
                    const data = await api.get(`/medicines/${medicineId}`);
                    if (data) {
                        setValue('name', data.name);
                        setValue('unit', data.unit);
                    } else {
                        toast.error('Data obat tidak ditemukan.');
                        navigate('/obat');
                    }
                } catch (error) {
                    toast.error('Gagal mengambil data obat.');
                } finally {
                    setIsFetchingData(false);
                }
            };
            fetchMedicine();
        }
    }, [isEditMode, medicineId, setValue, navigate]);

    const onSubmit: SubmitHandler<MedicineFormData> = async (data) => {
        setIsLoading(true);
        if (!user) {
            toast.error('Anda harus login.');
            setIsLoading(false);
            return;
        }

        const now = new Date().toISOString();

        try {
            const medicineData = {
                clinicId: user.uid,
                name: data.name,
                unit: data.unit,
                price: 0,
                updatedAt: now,
                createdBy: user.uid,
            };

            if (isEditMode && medicineId) {
                // UPDATE
                await api.put(`/medicines/${medicineId}`, medicineData);
                toast.success(`Data obat ${data.name} diperbarui.`);
                navigate('/obat');
            } else {
                // CREATE
                const newMedicineData = {
                    ...medicineData,
                    createdAt: now,
                };
                await api.post('/medicines', newMedicineData);
                toast.success(`Obat ${data.name} berhasil ditambahkan.`);
                navigate('/obat');
            }
        } catch (error) {
            console.error("Error saving medicine:", error);
            toast.error('Gagal menyimpan data obat. Cek koneksi atau izin.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetchingData) return <p className="text-center text-gray-600 dark:text-gray-400 p-10">Memuat data...</p>;

    return (
        <div className="max-w-3xl mx-auto pb-20">
            <div className="bg-gradient-to-r from-purple-50 to-white dark:from-dark-surface dark:to-dark-bg p-6 rounded-t-2xl border border-purple-100 dark:border-dark-border border-b-0">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {isEditMode ? 'Edit Data Obat' : 'Tambah Obat Baru'}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Lengkapi formulir di bawah ini dengan benar.</p>
            </div>

            <div className="bg-white dark:bg-dark-surface p-6 md:p-8 rounded-b-2xl shadow-soft dark:shadow-none border border-purple-100 dark:border-dark-border border-t-0 transition-colors">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                    {/* Nama Obat */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nama Obat</label>
                        <input
                            {...register('name')}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                            placeholder="Masukkan nama obat"
                        />
                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                    </div>

                    {/* Satuan */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Satuan</label>
                        <div className="relative">
                            <Controller
                                name="unit"
                                control={control}
                                render={({ field }) => (
                                    <select {...field} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none bg-white">
                                        <option value="">-- Pilih Satuan --</option>
                                        {MEDICINE_UNITS.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                                    </select>
                                )}
                            />
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                        {errors.unit && <p className="mt-1 text-sm text-red-600">{errors.unit.message}</p>}
                    </div>

                    {/* Tombol Aksi */}
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={() => navigate('/obat')}
                            className="w-full sm:w-auto px-6 py-3 font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || isLoading}
                            className="w-full sm:w-auto px-8 py-3 font-bold text-white bg-purple-600 rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-200 dark:shadow-none hover:shadow-purple-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
                        >
                            {isSubmitting || isLoading ? 'Menyimpan...' : 'SIMPAN'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}

export default MedicineForm;
