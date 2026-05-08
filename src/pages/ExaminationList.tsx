import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { getWibCurrentDateString, formatWibSafe } from '../utils/date';
import { 
    Patient, 
    ClinicSettings
} from '../types';
import { api } from '../api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { subscribePatientQueueUpdate, PatientQueueUpdateDetail } from '../utils/patientQueueSync';
import { subscribeDataSync } from '../utils/dataSync';
import { getExaminationUnitLabel, getExaminationQueueLabel } from '../utils/clinic';
import SickLeaveCertificate from '../components/SickLeaveCertificate';

const OPTIMISTIC_QUEUE_HIDE_MS = 3000;

function ExaminationList() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [latestExaminationAt, setLatestExaminationAt] = useState<Record<string, string>>({});
    const [latestExamIdByPatient, setLatestExamIdByPatient] = useState<Record<string, string>>({});
    const [optimisticallyHiddenPatientIds, setOptimisticallyHiddenPatientIds] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'Antrian' | 'Selesai' | 'Semua'>('Antrian');
    const [currentPage, setCurrentPage] = useState(1);
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuth();
    
    // Settings & Printing State
    const [settings, setSettings] = useState<ClinicSettings | null>(null);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [printData, setPrintData] = useState<{
        patient: Patient;
        startDate: string;
        endDate: string;
        days: number | string;
        printSize: 'A5' | 'A4' | 'F4';
        address: string;
        occupation: string;
        diagnosis: string;
    } | null>(null);

    const selectedDateValue = searchParams.get('tanggal') || getWibCurrentDateString();
    const selectedDate = selectedDateValue;
    
    const examinationUnitLabel = useMemo(() => getExaminationUnitLabel(user?.clinicType), [user?.clinicType]);
    const examinationQueueLabel = useMemo(() => getExaminationQueueLabel(user?.clinicType), [user?.clinicType]);

    // Data Fetching Logic (Memoized)
    const fetchPatients = useCallback(async (showLoading = false) => {
        if (!user) return;
        if (showLoading) setLoading(true);

        try {
            const data = await api.get('/patients');
            const allPatients = Array.isArray(data) ? data : [];
            const now = Date.now();

            setPatients(allPatients);

            // Auto-cleanup expired optimistic IDs
            setOptimisticallyHiddenPatientIds(prev => {
                const filtered = Object.fromEntries(
                    Object.entries(prev).filter(([, expiresAt]) => expiresAt > now)
                );
                return Object.keys(filtered).length === Object.keys(prev).length ? prev : filtered;
            });
        } catch (e) {
            console.error(e);
            toast.error("Gagal memuat data pasien");
        } finally {
            if (showLoading) setLoading(false);
        }
    }, [user]);

    const fetchExaminations = useCallback(async () => {
        if (!user) return;
        // Konversi ke UTC ISO — SQLite membandingkan string karakter per karakter,
        // jadi boundary HARUS dalam format yang sama dengan createdAt di DB ('...Z')
        const start = new Date(`${selectedDate}T00:00:00+07:00`).toISOString();
        const end = new Date(`${selectedDate}T23:59:59.999+07:00`).toISOString();
        try {
            const exams = await api.get(`/examinations?startDate=${start}&endDate=${end}`);
            const latestByPatient: Record<string, string> = {};
            const latestIdByPatient: Record<string, string> = {};
            (exams || []).forEach((e: any) => {
                if (!e.patientId) return;
                const examTime = String(e.createdAt || e.date || '');
                if (!examTime) return;
                if (!latestByPatient[e.patientId] || new Date(examTime).getTime() > new Date(latestByPatient[e.patientId]).getTime()) {
                    latestByPatient[e.patientId] = examTime;
                    latestIdByPatient[e.patientId] = e.id;
                }
            });
            setLatestExaminationAt(latestByPatient);
            setLatestExamIdByPatient(latestIdByPatient);
        } catch (e) {
            console.error(e);
        }
    }, [user, selectedDate]);

    const fetchSettings = useCallback(async () => {
        if (!user) return;
        try {
            const data = await api.get('/settings');
            setSettings(data);
        } catch (e) {
            console.error("Gagal memuat pengaturan:", e);
        }
    }, [user]);

    // Initial load and settings fetch
    useEffect(() => {
        fetchPatients(true);
        fetchExaminations();
        fetchSettings();
    }, [user, selectedDateValue]); // Only re-fetch on identity or date change

    // Polling Effect (Isolated & Pausable)
    useEffect(() => {
        if (!user || isPrintModalOpen) return;

        const interval = setInterval(() => {
            fetchPatients(false);
            fetchExaminations();
        }, 10000);

        return () => clearInterval(interval);
    }, [user, isPrintModalOpen, fetchPatients, fetchExaminations]);

    // Sync Subscriptions
    useEffect(() => {
        if (!user) return;

        const unsubscribeQueueSync = subscribePatientQueueUpdate((detail: PatientQueueUpdateDetail) => {
            if (detail.action === 'dequeue' && detail.patientId) {
                setPatients((prev) => prev.map((p) => 
                    p.id === detail.patientId ? { ...p, poli: 'Selesai' as any } : p
                ));
                setOptimisticallyHiddenPatientIds((prev) => ({ ...prev, [detail.patientId!]: Date.now() + 1000 }));
                return;
            }
            if (detail.action === 'enqueue' && detail.patient) {
                setOptimisticallyHiddenPatientIds((prev) => {
                    const next = { ...prev };
                    delete next[detail.patient!.id];
                    return next;
                });
                // Inline upsert logic to avoid closure issues
                setPatients(prev => {
                    if (detail.patient!.poli !== 'Pemeriksaan') return prev;
                    const next = prev.filter(p => p.id !== detail.patient!.id);
                    next.push(detail.patient!);
                    next.sort((a, b) => new Date(a.updatedAt || 0).getTime() - new Date(b.updatedAt || 0).getTime());
                    return next;
                });
                return;
            }
            fetchPatients();
        });

        const unsubscribeDataSync = subscribeDataSync(['patients', 'examinations'], () => {
            fetchPatients();
            fetchExaminations();
        });

        return () => {
            unsubscribeQueueSync();
            unsubscribeDataSync();
        };
    }, [user, fetchPatients, fetchExaminations]);

    const handleDateChange = (date: string) => {
        setSearchParams({ tanggal: date });
        setCurrentPage(1);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleSaveSKS = async (shouldPrint: boolean = false) => {
        if (!printData || !settings) return;
        
        const daysNum = parseInt(String(printData.days));
        if (isNaN(daysNum) || daysNum <= 0) {
            toast.error("Durasi hari harus valid dan lebih dari 0");
            return;
        }

        try {
            // 1. Create SKS record in DB
            await api.post('/sks', {
                patientId: printData.patient.id,
                patientName: printData.patient.name,
                patientRm: printData.patient.rm,
                diagnosis: '-', // Diagnosis not required per user request
                occupation: printData.occupation,
                address: printData.address,
                startDate: printData.startDate,
                endDate: printData.endDate,
                days: daysNum,
                ticketNumber: `${(settings.lastSickLeaveNumber || 0) + 1} / SKS / ${format(new Date(), 'MM / yyyy')}`
            });

            if (shouldPrint) {
                const res = await api.post('/settings/increment-sick-leave', {});
                if (res?.nextNumber) {
                    setSettings({ ...settings, lastSickLeaveNumber: res.nextNumber });
                }
                setTimeout(handlePrint, 150);
            } else {
                toast.success("Berhasil disimpan ke riwayat SKS");
                setIsPrintModalOpen(false);
            }
        } catch (e: any) {
            console.error("Gagal memproses SKS:", e);
            toast.error(e.message || "Gagal memproses permintaan");
        }
    };

    const handleRemoveFromQueue = async (patientId: string, patientName: string) => {
        if (window.confirm(`Hapus ${patientName} dari antrian ${examinationQueueLabel}? (Data pasien tidak akan terhapus)`)) {
            const hiddenUntil = Date.now() + OPTIMISTIC_QUEUE_HIDE_MS;
            setOptimisticallyHiddenPatientIds((prev) => ({ ...prev, [patientId]: hiddenUntil }));

            try {
                await api.put(`/patients/${patientId}`, { 
                    poli: 'Pendaftaran',
                    updatedAt: new Date().toISOString()
                });
                toast.success(`${patientName} dikembalikan ke antrian pendaftaran`, { id: 'queue-return' });
            } catch (e) {
                console.error(e);
                toast.error("Gagal memproses permintaan");
                setOptimisticallyHiddenPatientIds(prev => {
                    const next = { ...prev };
                    delete next[patientId];
                    return next;
                });
            }
        }
    };

    const openPrintModal = async (patient: Patient) => {
        try {
            const latestSettings = await api.get('/settings');
            setSettings(latestSettings);
            
            const start = getWibCurrentDateString();
            const end = getWibCurrentDateString();
            
            setPrintData({
                patient,
                startDate: start,
                endDate: end,
                days: 1,
                printSize: 'A4',
                address: patient.address || '',
                occupation: patient.occupation || '-',
                diagnosis: ''
            });
            setIsPrintModalOpen(true);
        } catch (e) {
            console.error("Gagal memuat pengaturan:", e);
            toast.error("Gagal memuat data pencetakan");
        }
    };

    const activePatients = useMemo(() => {
        const now = Date.now();
        const isToday = selectedDate === getWibCurrentDateString();

        return patients.filter(p => {
            const hiddenUntil = optimisticallyHiddenPatientIds[p.id];
            if (hiddenUntil && hiddenUntil > now) return false;
            
            // Jika sedang antri, hanya tampilkan jika melihat tanggal HARI INI
            if (p.poli === "Pemeriksaan") {
                return isToday;
            }

            // Jika sudah selesai atau lainnya, tampilkan hanya jika ada record pemeriksaan di tanggal terpilih
            if (p.poli === "Selesai" || p.poli === "Selesai & Obat" || p.poli === "Pendaftaran") {
                return !!latestExaminationAt[p.id];
            }

            return false;
        }).sort((a, b) => {
            // Urutan antrian: yang paling lama menunggu di atas (berdasarkan updatedAt)
            if (a.poli === 'Pemeriksaan' && b.poli === 'Pemeriksaan') {
                return new Date(a.updatedAt || 0).getTime() - new Date(b.updatedAt || 0).getTime();
            }
            // Untuk yang selesai: yang paling baru diperiksa di atas
            return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
        });
    }, [patients, optimisticallyHiddenPatientIds, latestExaminationAt, selectedDate]);

    const filteredPatients = activePatients.filter(p => {
        const query = searchTerm.toLowerCase();
        const matchesSearch = 
            p.name.toLowerCase().includes(query) || 
            (p.rm && p.rm.toLowerCase().includes(query));
        
        if (filterStatus === 'Semua') return matchesSearch;
        if (filterStatus === 'Antrian') return matchesSearch && p.poli === 'Pemeriksaan';
        if (filterStatus === 'Selesai') return matchesSearch && p.poli === 'Selesai';
        return matchesSearch;
    });

    const itemsPerPage = 10;
    const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
    const paginatedPatients = filteredPatients.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{examinationUnitLabel}</h1>
                    <p className="text-gray-500 dark:text-gray-400">Kelola antrian dan pemeriksaan {examinationQueueLabel} hari ini</p>
                </div>
                <div className="flex items-center gap-3">
                    <input 
                        type="date"
                        className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                        value={selectedDateValue}
                        onChange={(e) => handleDateChange(e.target.value)}
                    />
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3 space-y-4">
                    <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-dark-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                                {(['Antrian', 'Selesai', 'Semua'] as const).map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => { setFilterStatus(status); setCurrentPage(1); }}
                                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                            filterStatus === status 
                                                ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-primary-400' 
                                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                        }`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </span>
                                <input 
                                    type="text" 
                                    placeholder="Cari nama atau RM..." 
                                    className="pl-10 pr-4 py-2 w-72 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 transition-all"
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-bold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Pasien</th>
                                        <th className="px-6 py-4">RM</th>
                                        <th className="px-6 py-4">Kategori</th>
                                        <th className="px-6 py-4">Waktu</th>
                                        <th className="px-6 py-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500">Memuat data...</td>
                                        </tr>
                                    ) : paginatedPatients.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500">Tidak ada pasien dalam daftar ini</td>
                                        </tr>
                                    ) : (
                                        paginatedPatients.map((patient) => (
                                            <tr key={patient.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
                                                        {patient.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{patient.ageDisplay} • {patient.gender}</div>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-sm">{patient.rm || '-'}</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                                                        {patient.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {patient.poli === 'Selesai' ? (
                                                        <div className="flex flex-col">
                                                            <span className="inline-flex items-center w-fit gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                                                                Selesai
                                                            </span>
                                                            {latestExaminationAt[patient.id] && (
                                                                <span className="text-[10px] text-gray-400 mt-1">
                                                                    {formatWibSafe(latestExaminationAt[patient.id], 'HH:mm')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="inline-flex items-center w-fit gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                                            Antri
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {patient.poli === 'Pemeriksaan' ? (
                                                        <div className="flex justify-end gap-2">
                                                            <button 
                                                                onClick={() => handleRemoveFromQueue(patient.id, patient.name)}
                                                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                                title="Kembalikan ke Pendaftaran"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                                            </button>
                                                            <button 
                                                                onClick={() => navigate(`/pemeriksaan/${patient.id}`)}
                                                                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-all flex items-center gap-2"
                                                            >
                                                                Periksa
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex justify-end gap-2">
                                                            <button 
                                                                onClick={() => openPrintModal(patient)}
                                                                className="p-2 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all"
                                                                title="Cetak Surat Sakit"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                            </button>
                                                            <button 
                                                                onClick={() => {
                                                                    const examId = latestExamIdByPatient[patient.id];
                                                                    if (!examId) return;
                                                                    if (window.confirm(`Hapus rekam medis ${patient.name} untuk hari ini?`)) {
                                                                        api.delete(`/examinations/${examId}`)
                                                                            .then(() => {
                                                                                toast.success("Rekam medis berhasil dihapus");
                                                                                fetchExaminations();
                                                                            })
                                                                            .catch(e => toast.error("Gagal menghapus rekam medis"));
                                                                    }
                                                                }}
                                                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                                                                title="Hapus Pemeriksaan"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                            <button 
                                                                onClick={() => {
                                                                    const examId = latestExamIdByPatient[patient.id];
                                                                    const url = `/pemeriksaan/${patient.id}?tanggal=${selectedDateValue}${examId ? `&examId=${examId}` : ''}`;
                                                                    navigate(url);
                                                                }}
                                                                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
                                                                title="Edit Pemeriksaan"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="px-6 py-4 border-t border-gray-100 dark:border-dark-border flex items-center justify-between">
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Halaman {currentPage} dari {totalPages}
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                                    </button>
                                    <button 
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-primary-600 rounded-2xl p-6 text-white shadow-lg shadow-primary-500/20">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-white/20 rounded-xl">
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            </div>
                            <h3 className="font-bold">Status Antrian</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <span className="text-primary-100 text-sm italic">Menunggu</span>
                                <span className="text-3xl font-black">{activePatients.filter(p => p.poli === 'Pemeriksaan').length}</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="text-primary-100 text-sm italic">Selesai</span>
                                <span className="text-3xl font-black">{activePatients.filter(p => p.poli === 'Selesai' || p.poli === 'Selesai & Obat').length}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 border border-gray-100 dark:border-dark-border shadow-sm">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Ringkasan Hari Ini</h4>
                        <div className="space-y-4">
                            <div className="flex gap-4 items-center">
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-gray-900 dark:text-white">{format(new Date(selectedDate), 'dd MMMM yyyy', { locale: localeId })}</div>
                                    <div className="text-xs text-gray-500">Tanggal Operasional</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Cetak Surat Sakit */}
            {isPrintModalOpen && printData && settings && (
                <div key="sks-print-modal-overlay" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 no-print">
                    <div key="sks-modal-content" className="bg-white dark:bg-dark-surface rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden border-2 border-gray-900 dark:border-gray-700">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-dark-border flex justify-between items-center bg-white dark:bg-dark-surface">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Cetak Surat Keterangan Sakit</h3>
                            <button onClick={() => setIsPrintModalOpen(false)} className="text-gray-400 hover:text-gray-500 transition-colors">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-900/10 px-6 py-2 border-b border-amber-100 dark:border-amber-900/20">
                            <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                                Nomor Surat Otomatis: {(settings.lastSickLeaveNumber || 0) + 1} / SKS / {format(new Date(), 'MM / yyyy')}
                            </p>
                        </div>

                        <div className="flex-1 overflow-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Controls */}
                            <div className="lg:col-span-1 space-y-5">
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider italic">Ukuran Kertas</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['A5', 'A4', 'F4'] as const).map(size => (
                                            <button
                                                key={size}
                                                onClick={() => setPrintData({ ...printData, printSize: size })}
                                                className={`py-2 px-1 rounded-xl border-2 font-bold transition-all text-xs ${
                                                    printData.printSize === size 
                                                        ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400' 
                                                        : 'border-gray-100 dark:border-gray-800 text-gray-400'
                                                }`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider italic">Dari Tanggal</label>
                                        <input 
                                            type="date" 
                                            className="w-full px-3 py-2 rounded-xl border-2 border-gray-900 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm font-black"
                                            value={printData.startDate}
                                            onChange={e => {
                                                const start = new Date(e.target.value);
                                                const end = new Date(start);
                                                const days = parseInt(String(printData.days)) || 1;
                                                end.setDate(start.getDate() + days - 1);
                                                setPrintData({ ...printData, startDate: e.target.value, endDate: format(end, 'yyyy-MM-dd') });
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider italic">Durasi (Hari)</label>
                                        <input 
                                            type="number" 
                                            className="w-full px-3 py-2 rounded-xl border-2 border-gray-900 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm font-black"
                                            value={printData.days}
                                            onChange={e => {
                                                const val = e.target.value;
                                                if (val === '') {
                                                    setPrintData({...printData, days: ''});
                                                    return;
                                                }
                                                const d = parseInt(val) || 1;
                                                const start = new Date(printData.startDate);
                                                const end = new Date(start);
                                                end.setDate(start.getDate() + d - 1);
                                                setPrintData({ ...printData, days: d, endDate: format(end, 'yyyy-MM-dd') });
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider italic">Hingga Tanggal</label>
                                    <input 
                                        type="date" 
                                        className="w-full px-3 py-2 rounded-xl border-2 border-gray-900 dark:border-gray-700 bg-gray-200 dark:bg-gray-700 text-sm font-black"
                                        value={printData.endDate}
                                        readOnly
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider italic font-bold">Pekerjaan</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 rounded-xl border-2 border-gray-900 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm font-black"
                                        value={printData.occupation}
                                        onChange={(e) => setPrintData({ ...printData, occupation: e.target.value })}
                                        placeholder="Pekerjaan pasien..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider italic font-bold">Alamat Pasien</label>
                                    <textarea
                                        rows={2}
                                        className="w-full px-3 py-2 rounded-xl border-2 border-gray-900 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm font-black"
                                        value={printData.address}
                                        onChange={(e) => setPrintData({ ...printData, address: e.target.value })}
                                        placeholder="Alamat lengkap pasien..."
                                    />
                                </div>

                                <div className="grid gap-3 pt-2">
                                    <button
                                        onClick={() => handleSaveSKS(false)}
                                        className="w-full py-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 border border-blue-200 dark:border-blue-800"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                                        SIMPAN KE RIWAYAT
                                    </button>
                                    <button
                                        onClick={() => handleSaveSKS(true)}
                                        className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl shadow-xl shadow-primary-500/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                        </svg>
                                        CETAK SEKARANG
                                    </button>
                                </div>
                            </div>

                            {/* Preview Area */}
                            <div className="lg:col-span-2 bg-gray-50 dark:bg-gray-900/50 rounded-3xl overflow-auto border border-gray-100 dark:border-gray-800 p-8 flex justify-center">
                                <div className="origin-top scale-[0.5] sm:scale-[0.7] md:scale-[0.85] transition-transform">
                                    <SickLeaveCertificate
                                        key={`preview-${printData.patient.id}-${printData.printSize}`}
                                        patient={{ ...printData.patient, address: printData.address }}
                                        settings={settings}
                                        diagnosis={printData.diagnosis}
                                        startDate={printData.startDate}
                                        endDate={printData.endDate}
                                        days={parseInt(String(printData.days)) || 0}
                                        printSize={printData.printSize}
                                        occupation={printData.occupation}
                                        ticketNumber={`${(settings.lastSickLeaveNumber || 0) + 1} / SKS / ${format(new Date(), 'MM / yyyy')}`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ExaminationList;
