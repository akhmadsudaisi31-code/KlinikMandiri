import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { db, Timestamp, auth } from '../firebaseConfig';
import {
    doc,
    getDoc,
    addDoc,
    collection,
    query,
    onSnapshot,
    orderBy,
    where
} from 'firebase/firestore';
import { Patient, Medicine, MedicineItem } from '../types';
import toast from 'react-hot-toast';

const schema = z.object({
    keluhan: z.string().optional(),
    pemeriksaan: z.string().optional(),
    diagnosa: z.string().optional(),
    biaya: z.string().optional(),
});

type ExaminationFormData = {
    keluhan?: string;
    pemeriksaan?: string;
    diagnosa?: string;
    biaya?: string;
};

function ExaminationForm() {
    const { patientId } = useParams<{ patientId: string }>();
    const navigate = useNavigate();

    const [patient, setPatient] = useState<Patient | null>(null);
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [selectedMedicines, setSelectedMedicines] = useState<MedicineItem[]>([]);
    const [patientHistory, setPatientHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingData, setIsFetchingData] = useState(true);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting }
    } = useForm<ExaminationFormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            keluhan: '',
            pemeriksaan: '',
            diagnosa: '',
            biaya: '',
        }
    });

    // Fetch patient data
    useEffect(() => {
        if (!patientId) {
            toast.error('ID Pasien tidak valid');
            navigate('/pemeriksaan');
            return;
        }

        const fetchPatient = async () => {
            try {
                const docRef = doc(db, 'patients', patientId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setPatient({ id: docSnap.id, ...docSnap.data() } as Patient);
                } else {
                    toast.error('Data pasien tidak ditemukan.');
                    navigate('/pemeriksaan');
                }
            } catch (error) {
                toast.error('Gagal mengambil data pasien.');
                navigate('/pemeriksaan');
            } finally {
                setIsFetchingData(false);
            }
        };

        fetchPatient();
    }, [patientId, navigate]);

    // Fetch patient examination history
    useEffect(() => {
        if (!patientId) return;

        const q = query(
            collection(db, 'examinations'),
            where('patientId', '==', patientId),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const history: any[] = [];
            querySnapshot.forEach((doc) => {
                history.push({ id: doc.id, ...doc.data() });
            });
            setPatientHistory(history);
        });

        return () => unsubscribe();
    }, [patientId]);

    // Fetch medicines
    useEffect(() => {
        const q = query(collection(db, "medicines"), orderBy("name", "asc"));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const medicinesData: Medicine[] = [];
            querySnapshot.forEach((doc) => {
                medicinesData.push({ id: doc.id, ...doc.data() } as Medicine);
            });
            setMedicines(medicinesData);
        }, (error) => {
            console.error("Error fetching medicines: ", error);
        });

        return () => unsubscribe();
    }, []);

    const handleAddMedicine = (medicineId: string) => {
        const medicine = medicines.find(m => m.id === medicineId);
        if (!medicine) return;

        // Check if already added
        if (selectedMedicines.find(m => m.medicineId === medicineId)) {
            toast.error('Obat sudah ditambahkan');
            return;
        }

        const newMedicineItem: MedicineItem = {
            medicineId: medicine.id,
            medicineName: medicine.name,
            quantity: 1,
            unit: medicine.unit,
        };

        setSelectedMedicines([...selectedMedicines, newMedicineItem]);
    };

    const handleRemoveMedicine = (medicineId: string) => {
        setSelectedMedicines(selectedMedicines.filter(m => m.medicineId !== medicineId));
    };

    const handleQuantityChange = (medicineId: string, quantity: number) => {
        if (quantity < 1) return;
        setSelectedMedicines(selectedMedicines.map(m =>
            m.medicineId === medicineId ? { ...m, quantity } : m
        ));
    };

    const onSubmit: SubmitHandler<ExaminationFormData> = async (data) => {
        setIsLoading(true);
        const currentUser = auth.currentUser;
        if (!currentUser) {
            toast.error('Anda harus login.');
            setIsLoading(false);
            return;
        }

        if (!patient) {
            toast.error('Data pasien tidak ditemukan.');
            setIsLoading(false);
            return;
        }

        const now = Timestamp.now();

        try {
            const examinationData: any = {
                patientId: patient.id,
                patientName: patient.name,
                patientRm: patient.rm,
                date: now,
                createdAt: now,
                createdBy: currentUser.uid,
            };

            // Only add fields if they have values
            if (data.keluhan) examinationData.keluhan = data.keluhan;
            if (data.pemeriksaan) examinationData.pemeriksaan = data.pemeriksaan;
            if (data.diagnosa) examinationData.diagnosa = data.diagnosa;
            if (selectedMedicines.length > 0) examinationData.medicines = selectedMedicines;
            if (data.biaya && Number(data.biaya) > 0) {
                examinationData.biaya = Number(data.biaya);
            }

            await addDoc(collection(db, 'examinations'), examinationData);
            toast.success(`Pemeriksaan untuk ${patient.name} berhasil disimpan.`);
            navigate('/pemeriksaan');
        } catch (error) {
            console.error("Error saving examination:", error);
            toast.error('Gagal menyimpan data pemeriksaan. Cek koneksi atau izin.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetchingData) return <p className="text-center text-gray-600 dark:text-gray-400 p-10">Memuat data...</p>;
    if (!patient) return null;

    return (
        <div className="w-full mx-auto pb-20">
            {/* Patient Info Header */}
            <div className="bg-gradient-to-r from-green-50 to-white dark:from-dark-surface dark:to-dark-bg p-6 rounded-t-2xl border border-green-100 dark:border-dark-border border-b-0">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Form Pemeriksaan</h1>
                <div className="mt-3 flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400">Pasien:</span>
                        <span className="font-bold text-gray-900 dark:text-white">{patient.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400">RM:</span>
                        <span className="font-mono font-bold text-gray-900 dark:text-white">{patient.rm}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400">Umur:</span>
                        <span className="font-bold text-gray-900 dark:text-white">{patient.ageDisplay}</span>
                    </div>
                </div>
            </div>

            {/* Patient Visit History */}
            {patientHistory.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 border-x border-blue-100 dark:border-blue-800">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-blue-600 dark:text-blue-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Riwayat Kunjungan ({patientHistory.length})
                    </h2>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                        {patientHistory.map((visit, index) => (
                            <div key={visit.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-blue-200 dark:border-gray-700">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                        Kunjungan #{patientHistory.length - index}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {visit.createdAt && new Date(visit.createdAt.toDate()).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </span>
                                </div>
                                {visit.diagnosa && (
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                                        <span className="font-semibold">Diagnosa:</span> {visit.diagnosa}
                                    </p>
                                )}
                                {visit.medicines && visit.medicines.length > 0 && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        <span className="font-semibold">Obat:</span> {visit.medicines.map((m: any) => m.medicineName).join(', ')}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-dark-surface p-6 md:p-8 rounded-b-2xl shadow-soft dark:shadow-none border border-green-100 dark:border-dark-border border-t-0 transition-colors">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                    {/* Keluhan */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Keluhan Pasien</label>
                        <textarea
                            {...register('keluhan')}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                            placeholder="Tuliskan keluhan yang disampaikan pasien..."
                        />
                        {errors.keluhan && <p className="mt-1 text-sm text-red-600">{errors.keluhan.message}</p>}
                    </div>

                    {/* Pemeriksaan */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Hasil Pemeriksaan</label>
                        <textarea
                            {...register('pemeriksaan')}
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                            placeholder="Tuliskan hasil pemeriksaan fisik, vital signs, dll..."
                        />
                        {errors.pemeriksaan && <p className="mt-1 text-sm text-red-600">{errors.pemeriksaan.message}</p>}
                    </div>

                    {/* Diagnosa */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Diagnosa</label>
                        <textarea
                            {...register('diagnosa')}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                            placeholder="Tuliskan diagnosa medis..."
                        />
                        {errors.diagnosa && <p className="mt-1 text-sm text-red-600">{errors.diagnosa.message}</p>}
                    </div>

                    {/* Obat Section */}
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-5 rounded-xl border border-purple-100 dark:border-purple-800">
                        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-purple-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                            </svg>
                            Obat yang Diberikan
                        </h3>

                        {/* Add Medicine Dropdown */}
                        <div className="mb-4">
                            <select
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none bg-white"
                                onChange={(e) => {
                                    if (e.target.value) {
                                        handleAddMedicine(e.target.value);
                                        e.target.value = '';
                                    }
                                }}
                                defaultValue=""
                            >
                                <option value="">-- Pilih Obat untuk Ditambahkan --</option>
                                {medicines.map(medicine => (
                                    <option key={medicine.id} value={medicine.id}>
                                        {medicine.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Selected Medicines List */}
                        {selectedMedicines.length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Belum ada obat yang dipilih</p>
                        ) : (
                            <div className="space-y-2">
                                {selectedMedicines.map((item) => (
                                    <div key={item.medicineId} className="flex items-center gap-3 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{item.medicineName}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleQuantityChange(item.medicineId, item.quantity - 1)}
                                                className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                                                </svg>
                                            </button>
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => handleQuantityChange(item.medicineId, parseInt(e.target.value) || 1)}
                                                className="w-16 px-2 py-1 text-center border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg text-sm font-bold"
                                                min="1"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleQuantityChange(item.medicineId, item.quantity + 1)}
                                                className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                                </svg>
                                            </button>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveMedicine(item.medicineId)}
                                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                            title="Hapus"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Biaya (Optional) */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Biaya (Opsional)
                        </label>
                        <input
                            type="number"
                            {...register('biaya')}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                            placeholder="0"
                            min="0"
                        />
                        {errors.biaya && <p className="mt-1 text-sm text-red-600">{errors.biaya.message}</p>}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-1">Kosongkan jika tidak ada biaya</p>
                    </div>

                    {/* Tombol Aksi */}
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={() => navigate('/pemeriksaan')}
                            className="w-full sm:w-auto px-6 py-3 font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || isLoading}
                            className="w-full sm:w-auto px-8 py-3 font-bold text-white bg-green-600 rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 dark:shadow-none hover:shadow-green-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
                        >
                            {isSubmitting || isLoading ? 'Menyimpan...' : 'SIMPAN PEMERIKSAAN'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}

export default ExaminationForm;
