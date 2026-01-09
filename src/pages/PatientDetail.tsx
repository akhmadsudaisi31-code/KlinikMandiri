import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db, auth, Timestamp } from '../firebaseConfig';
import {
  doc, getDoc, collection, addDoc, query, where, orderBy, onSnapshot, deleteDoc, setDoc, serverTimestamp
} from 'firebase/firestore';
import { Patient, Visit, Examination } from '../types';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { formatRupiah, parseRupiah } from '../utils/format';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { ExaminationDetailModal } from '../components/ExaminationDetailModal';

type VisitFormData = {
  diagnosis: string;
  therapy: string;
  notes: string;
  cost: string;
};

function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [examinations, setExaminations] = useState<Examination[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVisitForm, setShowVisitForm] = useState(false);
  
  // Detail Modal
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset, control, formState: { isSubmitting } } = useForm<VisitFormData>();

  useEffect(() => {
    if (!id) return;

    const fetchPatient = async () => {
      try {
        const docRef = doc(db, 'patients', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPatient({ id: docSnap.id, ...docSnap.data() } as Patient);
        } else {
          toast.error("Pasien tidak ditemukan");
          navigate('/');
        }
      } catch (e: any) {
        console.error(e);
        if (e.code === 'permission-denied') {
          toast.error("Tidak memiliki izin untuk mengakses data pasien. Silakan login ulang.");
          navigate('/login');
        } else {
          toast.error("Gagal memuat data pasien");
        }
      }
    };

    fetchPatient();

    const q = query(
      collection(db, 'visits'),
      where('patientId', '==', id),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const visitsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Visit));
      setVisits(visitsData);
      setLoading(false);
    }, (error) => {
      console.error("Error in visits listener:", error);
      setLoading(false);
    });

    const qExams = query(
      collection(db, 'examinations'),
      where('patientId', '==', id),
      orderBy('date', 'desc')
    );

    const unsubscribeExams = onSnapshot(qExams, (snapshot) => {
      const examsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Examination));
      setExaminations(examsData);
    });

    return () => {
      unsubscribe();
      unsubscribeExams();
    };

    return () => unsubscribe();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!patient || !auth.currentUser) return;

    if (window.confirm(`PERINGATAN: Apakah Anda yakin ingin MENGHAPUS PERMANEN data pasien ${patient.name}? Data yang dihapus tidak dapat dikembalikan.`)) {
      try {
        await deleteDoc(doc(db, "patients", patient.id));
        toast.success(`Data pasien ${patient.name} telah dihapus.`);
        navigate('/');
      } catch (error) {
        console.error("Gagal menghapus:", error);
        toast.error("Terjadi kesalahan saat menghapus data.");
      }
    }
  };

  const handleAddToPoli = async () => {
    if (!patient) return;
    if (window.confirm(`Tambahkan ${patient.name} ke antrian Poli Pemeriksaan?`)) {
      try {
        const patientRef = doc(db, "patients", patient.id);
        await setDoc(patientRef, {
          poli: "Pemeriksaan",
          updatedAt: Timestamp.now()
        }, { merge: true });

        // Kirim Notifikasi ke Pemeriksa
        try {
          await addDoc(collection(db, "notifications"), {
             type: 'NEW_PATIENT',
             patientId: patient.id,
             patientName: patient.name,
             message: `Pasien: ${patient.name} dikirim ke antrian pemeriksaan.`,
             read: false,
             createdAt: serverTimestamp(),
             toRole: 'pemeriksa'
          });
        } catch (error) {
          console.error("Gagal kirim notif:", error);
        }

        navigate('/pemeriksaan');
      } catch (error) {
        console.error("Error updating patient: ", error);
        toast.error("Gagal menambahkan pasien ke poli.");
      }
    }
  };

  const onSaveVisit = async (data: VisitFormData) => {
    if (!auth.currentUser || !patient) return;

    try {
      await addDoc(collection(db, 'visits'), {
        patientId: patient.id,
        patientName: patient.name,
        patientRm: patient.rm,
        date: Timestamp.now(),
        diagnosis: data.diagnosis || '-',
        therapy: data.therapy || '-',
        notes: data.notes || '',
        cost: typeof data.cost === 'string' ? parseRupiah(data.cost) : (Number(data.cost) || 0),
        createdBy: auth.currentUser.uid
      });

      toast.success('Kunjungan berhasil dicatat!');
      reset();
      setShowVisitForm(false);
    } catch (error) {
      console.error(error);
      toast.error('Gagal menyimpan kunjungan.');
    }
  };

  if (loading) return <div className="text-center p-10 text-gray-500 dark:text-gray-400">Memuat data rekam medis...</div>;
  if (!patient) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start pb-20">

      {/* KOLOM KIRI: INFORMASI PASIEN */}
      <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
        <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-soft dark:shadow-none border border-gray-100 dark:border-dark-border overflow-hidden transition-colors">
          <div className="bg-gradient-to-r from-primary-50 to-white dark:from-dark-bg dark:to-dark-surface px-6 py-4 border-b border-primary-100 dark:border-dark-border flex justify-between items-center">
            <h2 className="text-primary-800 dark:text-primary-400 font-bold flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              Identitas Pasien
            </h2>
            <Link to={`/pasien/edit/${patient.id}`} className="text-xs font-bold text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 bg-white dark:bg-gray-800 px-3 py-1 rounded-full border border-primary-100 dark:border-gray-700 shadow-sm">Edit</Link>
          </div>
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="inline-flex h-24 w-24 rounded-full bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900 dark:to-primary-800 items-center justify-center text-primary-600 dark:text-primary-300 text-3xl font-bold mb-3 shadow-inner">
                {patient.name.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{patient.name}</h3>
              <span className="inline-block mt-2 px-4 py-1 bg-gray-900 dark:bg-gray-700 text-white rounded-full text-sm font-mono font-medium tracking-wide">
                {patient.rm}
              </span>
            </div>

            <div className="space-y-4 text-sm border-t border-gray-100 dark:border-gray-800 pt-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">Kategori</span>
                <span className="font-semibold text-gray-900 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{patient.category}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">Jenis Kelamin</span>
                <span className="font-medium text-gray-900 dark:text-gray-200">{patient.gender}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">Umur</span>
                <span className="font-medium text-gray-900 dark:text-gray-200">{patient.ageDisplay}</span>
              </div>
              <div className="pt-2">
                <span className="block text-gray-500 dark:text-gray-400 mb-2">Alamat</span>
                <div className="font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 text-sm leading-relaxed">
                  {patient.address}
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleAddToPoli}
          className="w-full py-3 mb-3 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl shadow-lg shadow-green-200 dark:shadow-none transition-all transform hover:-translate-y-0.5 flex justify-center items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Kirim ke Poli Pemeriksaan
        </button>

        <button onClick={() => navigate('/')} className="w-full py-3 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-dark-surface hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm hover:shadow-md mb-3">
          &larr; Kembali ke Dashboard
        </button>

        <button
          onClick={handleDelete}
          className="w-full py-3 text-sm font-bold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-red-100 dark:border-red-900/30 rounded-xl bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all shadow-sm"
        >
          Hapus Data Pasien
        </button>
      </div>

      {/* KOLOM KANAN: RIWAYAT KUNJUNGAN */}
      <div className="lg:col-span-2 space-y-6">

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <div className="h-8 w-1 bg-primary-500 rounded-full"></div>
            Rekam Medis
          </h2>
          {!showVisitForm && (
            <button
              onClick={() => setShowVisitForm(true)}
              className="w-full sm:w-auto inline-flex justify-center items-center px-5 py-2.5 border border-transparent rounded-xl shadow-md shadow-primary-200 dark:shadow-none text-sm font-bold text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 transition-all transform hover:-translate-y-0.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
              Catat Kunjungan
            </button>
          )}
        </div>

        {/* FORM INPUT KUNJUNGAN */}
        {showVisitForm && (
          <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-xl border border-primary-100 dark:border-gray-700 overflow-hidden ring-1 ring-primary-50 dark:ring-0 animate-fade-in-up transition-colors">
            <div className="bg-primary-600 px-6 py-4 flex justify-between items-center">
              <h3 className="text-white font-bold text-lg">Pemeriksaan Baru</h3>
              <button onClick={() => setShowVisitForm(false)} className="text-white/80 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit(onSaveVisit)} className="p-6 space-y-5">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-sm text-blue-800 dark:text-blue-300 mb-4 border border-blue-100 dark:border-blue-800">
                <span className="font-bold">Info:</span> Semua kolom di bawah ini opsional. Anda bisa langsung klik Simpan jika hanya ingin mencatat tanggal kunjungan.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Diagnosa / Keluhan</label>
                  <textarea
                    {...register('diagnosis')}
                    rows={2}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all dark:text-white"
                    placeholder="Contoh: Demam, Batuk..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Terapi / Tindakan</label>
                  <textarea
                    {...register('therapy')}
                    rows={2}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all dark:text-white"
                    placeholder="Contoh: Paracetamol..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Catatan (Opsional)</label>
                  <input {...register('notes')} className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Biaya (Rp)</label>
                  <Controller
                    control={control}
                    name="cost"
                    render={({ field: { onChange, value, ...rest } }) => (
                      <input
                        {...rest}
                        type="text"
                        value={value ? formatRupiah(Number(value)) : ''}
                        onChange={(e) => {
                          const numericValue = parseRupiah(e.target.value);
                          onChange(numericValue);
                        }}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all dark:text-white"
                        placeholder="Rp 0"
                      />
                    )}
                  />
                </div>
              </div>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={() => setShowVisitForm(false)} className="w-full sm:w-auto px-5 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Batal</button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-2.5 text-sm font-bold text-white bg-primary-600 rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-200 dark:shadow-none disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TIMELINE KUNJUNGAN */}
        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:ml-[8.75rem] md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-gray-200 dark:before:from-gray-700 before:via-gray-100 dark:before:via-gray-800 before:to-transparent z-0">
          {[...visits, ...examinations].length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-dark-surface rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 relative z-10">
              <div className="inline-block p-4 rounded-full bg-gray-50 dark:bg-gray-800 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Belum ada riwayat kunjungan tercatat.</p>
            </div>
          ) : (
            [...visits, ...examinations]
              .sort((a, b) => b.date.seconds - a.date.seconds)
              .map((item) => {
                const isExamination = 'pemeriksaan' in item;
                const diagnosis = isExamination ? (item as Examination).diagnosa : (item as Visit).diagnosis;

                return (
                  <div key={item.id} className="relative flex flex-col md:flex-row items-start group z-10">
                    {/* Tanggal (Desktop) */}
                    <div className="hidden md:block w-32 text-right pr-8 pt-2">
                      <div className="font-bold text-gray-900 dark:text-white text-lg leading-none">{format(item.date.toDate(), 'dd MMM', { locale: localeId })}</div>
                      <div className="text-sm text-gray-400 dark:text-gray-500 mt-1">{format(item.date.toDate(), 'yyyy', { locale: localeId })}</div>
                      <div className="text-xs font-mono text-primary-600 dark:text-primary-400 mt-1 bg-primary-50 dark:bg-primary-900/30 inline-block px-1.5 rounded">{format(item.date.toDate(), 'HH:mm', { locale: localeId })}</div>
                      {isExamination && <span className="block mt-1 text-[10px] font-bold text-purple-600 dark:text-purple-400">PEMERIKSAAN</span>}
                    </div>

                    {/* Dot */}
                    <div className={`absolute left-0 md:left-32 ml-3 md:ml-0 h-5 w-5 rounded-full border-4 border-white dark:border-dark-bg ${isExamination ? 'bg-purple-500' : 'bg-primary-500'} shadow-md group-hover:scale-125 transition-transform duration-300`}></div>

                    {/* Card */}
                    <div 
                        onClick={() => {
                            setSelectedItem(item);
                            setIsModalOpen(true);
                        }}
                        className="ml-10 md:ml-8 w-full bg-white dark:bg-dark-surface p-5 rounded-2xl border border-gray-100 dark:border-dark-border shadow-soft dark:shadow-none hover:shadow-lg dark:hover:bg-gray-800 transition-all duration-300 relative top-[-0.5rem] cursor-pointer"
                    >
                      {/* Tanggal (Mobile) */}
                      <div className="md:hidden flex items-center gap-2 mb-3 text-sm text-gray-500 pb-3 border-b border-gray-50 dark:border-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="font-bold text-gray-900 dark:text-white">{format(item.date.toDate(), 'dd MMMM yyyy', { locale: localeId })}</span>
                        <span className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs dark:text-gray-300">{format(item.date.toDate(), 'HH:mm', { locale: localeId })}</span>
                        {isExamination && <span className="ml-auto text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-full">PEMERIKSAAN</span>}
                      </div>

                      <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-1">
                          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Diagnosa</span>
                          <p className="text-gray-900 dark:text-gray-100 font-medium text-lg">{diagnosis || '-'}</p>
                        </div>

                        {/* Tampilan Khusus Pemeriksaan */}
                        {isExamination ? (
                          <>
                            {(item as Examination).keluhan && (
                              <div className="grid grid-cols-1 gap-1">
                                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Keluhan</span>
                                <p className="text-gray-700 dark:text-gray-300 italic">"{(item as Examination).keluhan}"</p>
                              </div>
                            )}
                            {(item as Examination).pemeriksaan && (
                              <div className="grid grid-cols-1 gap-1">
                                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Hasil Pemeriksaan</span>
                                <p className="text-gray-700 dark:text-gray-300">{(item as Examination).pemeriksaan}</p>
                              </div>
                            )}
                            {(item as Examination).medicines && (item as Examination).medicines.length > 0 && (
                              <div className="grid grid-cols-1 gap-1">
                                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Obat</span>
                                <div className="flex flex-wrap gap-2">
                                  {(item as Examination).medicines.map((med, idx) => (
                                    <span key={idx} className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-lg text-sm border border-purple-100 dark:border-purple-800">
                                      {med.medicineName} ({med.quantity} {med.unit})
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          // Tampilan Khusus Kunjungan (Visit)
                          <>
                            <div className="grid grid-cols-1 gap-1">
                              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Terapi / Tindakan</span>
                              <p className="text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">{(item as Visit).therapy || '-'}</p>
                            </div>
                            {(item as Visit).notes && (
                              <div className="flex gap-2 items-start text-sm text-yellow-700 dark:text-yellow-300 bg-yellow-50/50 dark:bg-yellow-900/20 p-2 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                                <span>{(item as Visit).notes}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>

      </div>
      
      <ExaminationDetailModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        data={selectedItem}
      />
    </div>
  );
}

export default PatientDetail;