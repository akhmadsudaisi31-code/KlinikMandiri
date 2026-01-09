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
    updateDoc,
    deleteDoc,
    collection,
    query,
    onSnapshot,
    orderBy,
    where
} from 'firebase/firestore';
import { Patient, Medicine, MedicineItem } from '../types';
import toast from 'react-hot-toast';
import { MedicineSelectorModal } from '../components/MedicineSelectorModal';
import { ExaminationDetailModal } from '../components/ExaminationDetailModal';

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
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Detail Modal State
    const [selectedExam, setSelectedExam] = useState<any>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    
    // State for Edit Mode
    const [editingExamId, setEditingExamId] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        reset,
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

    const handleEdit = (exam: any) => {
        setEditingExamId(exam.id);
        setValue('keluhan', exam.keluhan || '');
        setValue('pemeriksaan', exam.pemeriksaan || '');
        setValue('diagnosa', exam.diagnosa || '');
        setValue('biaya', exam.biaya ? String(exam.biaya) : '');
        setSelectedMedicines(exam.medicines || []);
        
        window.scrollTo({ top: 300, behavior: 'smooth' });
        toast('Masuk mode edit pemeriksaan.', { icon: '✏️', duration: 1000 });
    };

    const handleCancelEdit = () => {
        setEditingExamId(null);
        reset();
        setSelectedMedicines([]);
        toast('Batal edit.', { icon: '↩️', duration: 1000 });
    };

    const handleDelete = async (examId: string) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus riwayat pemeriksaan ini?")) {
            try {
                await deleteDoc(doc(db, "examinations", examId));
                toast.success("Riwayat pemeriksaan berhasil dihapus");
                if (editingExamId === examId) {
                    handleCancelEdit();
                }
            } catch (error) {
                console.error("Error deleting examination:", error);
                toast.error("Gagal menghapus pemeriksaan");
            }
        }
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
                // date: now, // Jangan update date jika edit? Atau update 'updatedAt'?
                // CreatedAt jangan diubah jika edit
                // CreatedBy jangan diubah
            };

            // Basic fields
            examinationData.keluhan = data.keluhan || null;
            examinationData.pemeriksaan = data.pemeriksaan || null;
            examinationData.diagnosa = data.diagnosa || null;
            examinationData.medicines = selectedMedicines;
            examinationData.biaya = data.biaya ? Number(data.biaya) : 0;
            examinationData.updatedAt = now;
            examinationData.updatedBy = currentUser.uid;

            if (editingExamId) {
                // UPDATE EXISTING
                const examRef = doc(db, 'examinations', editingExamId);
                await updateDoc(examRef, examinationData);
                toast.success(`Pemeriksaan berhasil diperbarui.`, { duration: 1000 });
                handleCancelEdit(); // Reset form & exit edit mode
            } else {
                // CREATE NEW
                examinationData.date = now;
                examinationData.createdAt = now;
                examinationData.createdBy = currentUser.uid;
                
                await addDoc(collection(db, 'examinations'), examinationData);
                toast.success(`Pemeriksaan untuk ${patient.name} berhasil disimpan.`);
                
                // Reset form manually for create mode (or use common reset)
                reset();
                setSelectedMedicines([]);
            }
            // navigate('/pemeriksaan'); // Stay on page to allow more inputs or review? 
            // Usually we stay or go back. The previous code navigated back.
            // If editing history, maybe stay? If creating new, maybe go back?
            // "on form pemeriksaan tambahkan tombol edit...". 
            // If I edit history, I probably want to see it updated in the list above.
            // Let's stay on the page for Edit, but for New... previously it navigated away.
            // Let's navigate away for NEW, stay for EDIT.
             if (!editingExamId) {
                 navigate('/pemeriksaan'); 
             }
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
            <div className={`bg-gradient-to-r ${editingExamId ? 'from-yellow-50 border-yellow-100' : 'from-green-50 border-green-100'} to-white dark:from-dark-surface dark:to-dark-bg p-6 rounded-t-2xl border dark:border-dark-border border-b-0`}>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {editingExamId ? 'Edit Pemeriksaan (Mode Koreksi)' : 'Form Pemeriksaan'}
                </h1>
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
                <div className="mt-2 flex items-center gap-2 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Alamat:</span>
                    <span className="font-bold text-gray-900 dark:text-white uppercase">{patient.address}</span>
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
                            <div 
                                key={visit.id} 
                                onClick={() => {
                                    setSelectedExam(visit);
                                    setIsDetailModalOpen(true);
                                }}
                                className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-blue-200 dark:border-gray-700 relative group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                        Kunjungan #{patientHistory.length - index}
                                    </span>
                                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
                                            {visit.createdAt && new Date(visit.createdAt.toDate()).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </span>
                                        {/* Action Buttons */}
                                        <button 
                                            onClick={() => handleEdit(visit)}
                                            className="p-1.5 text-yellow-600 hover:bg-yellow-100 rounded-md transition-colors"
                                            title="Edit Kunjungan"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                            </svg>
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(visit.id)}
                                            className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                                            title="Hapus Kunjungan"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                            </svg>
                                        </button>
                                    </div>
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

                        {/* Add Medicine Button (Mobile Friendly) */}
                        <div className="mb-4">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(true)}
                                className="w-full py-3 px-4 border-2 border-dashed border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/10 rounded-xl text-purple-600 dark:text-purple-400 font-semibold flex items-center justify-center gap-2 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Tambah Obat
                            </button>
                        </div>

                        <MedicineSelectorModal
                            isOpen={isModalOpen}
                            onClose={() => setIsModalOpen(false)}
                            medicines={medicines}
                            onSelect={handleAddMedicine}
                        />

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
                            onClick={editingExamId ? handleCancelEdit : () => navigate('/pemeriksaan')}
                            className="w-full sm:w-auto px-6 py-3 font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            {editingExamId ? 'Batal Edit' : 'Kembali'}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || isLoading}
                            className={`w-full sm:w-auto px-8 py-3 font-bold text-white rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 ${editingExamId ? 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-200 focus:ring-yellow-500' : 'bg-green-600 hover:bg-green-700 shadow-green-200 focus:ring-green-500'}`}
                        >
                            {isSubmitting || isLoading ? 'Menyimpan...' : (editingExamId ? 'SIMPAN PERUBAHAN' : 'SIMPAN PEMERIKSAAN')}
                        </button>
                    </div>

                </form>
            </div>
            {/* Detail Modal */}
            <ExaminationDetailModal 
                isOpen={isDetailModalOpen} 
                onClose={() => setIsDetailModalOpen(false)} 
                data={selectedExam} 
            />
        </div>
    );
}

export default ExaminationForm;
