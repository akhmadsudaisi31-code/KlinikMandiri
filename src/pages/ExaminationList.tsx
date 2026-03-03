import { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Patient } from '../types';
import { useNavigate } from 'react-router-dom';
import { format, startOfDay, endOfDay } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 10;

function ExaminationList() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [examinationStatus, setExaminationStatus] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const navigate = useNavigate();
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    useEffect(() => {
        setLoading(true);
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchPatients = async () => {
             try {
                 const start = startOfDay(selectedDate).getTime();
                 const end = endOfDay(selectedDate).getTime();
                 const data = await api.get('/patients');
                 const allPatients = Array.isArray(data) ? data : [];
                 const filtered = allPatients.filter(p => {
                      if (p.poli !== "Pemeriksaan") return false;
                      if (!p.updatedAt) return true;
                      const pTime = new Date(p.updatedAt).getTime();
                      return pTime >= start && pTime <= end;
                 });
                 // Sort by updatedAt descending
                 filtered.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
                 setPatients(filtered);
             } catch (e) {
                 console.error(e);
                 toast.error("Gagal memuat data pasien");
             } finally {
                 setLoading(false);
             }
        };

        fetchPatients();
    }, [user, selectedDate]);

    // Fetch examination status for all patients (Selected Date)
    useEffect(() => {
        if (!user) return;
        const start = startOfDay(selectedDate).toISOString();
        const end = endOfDay(selectedDate).toISOString();

        const fetchStatus = async () => {
             try {
                  const exams = await api.get(`/examinations?startDate=${start}&endDate=${end}`);
                  const status: Record<string, boolean> = {};
                  (exams || []).forEach((e: any) => {
                       if (e.patientId) status[e.patientId] = true;
                  });
                  setExaminationStatus(status);
             } catch (e) {
                  console.error(e);
             }
        };

        fetchStatus();
    }, [user, selectedDate]);

    const handleRemoveFromQueue = async (patientId: string, patientName: string) => {
        if (window.confirm(`Hapus ${patientName} dari antrian pemeriksaan? (Data pasien tidak akan terhapus)`)) {
            try {
                await api.put(`/patients/${patientId}`, { poli: "Umum" });
                setPatients(prev => prev.filter(p => p.id !== patientId));
            } catch (error) {
                console.error("Error removing from queue: ", error);
                toast.error("Gagal menghapus dari antrian.");
            }
        }
    };

    const handleCallPatient = async (patient: Patient) => {
        try {
            await api.post('/notifications', {
                type: 'CALL_PATIENT',
                patientId: patient.id,
                patientName: patient.name,
                message: `Panggilan untuk Pasien: ${patient.name} (${patient.rm}) - MASUK KE RUANG PEMERIKSAAN`,
                read: false,
                createdAt: new Date().toISOString(),
                toRole: 'pendaftar',
                clinicId: user?.uid
            });
            toast.success("Pasien dipanggil.");
        } catch (error) {
            console.error("Error calling patient: ", error);
             toast.error("Gagal memanggil pasien (Masalah Izin/Koneksi).");
        }
    };

    const filteredPatients = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        if (!lowerSearch) return patients;
        return patients.filter(p =>
            p.name.toLowerCase().includes(lowerSearch) ||
            p.address.toLowerCase().includes(lowerSearch) ||
            p.rm.includes(lowerSearch)
        );
    }, [patients, searchTerm]);

    const paginatedPatients = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredPatients.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredPatients, currentPage]);

    const totalPages = Math.ceil(filteredPatients.length / ITEMS_PER_PAGE);

    return (
        <div className="space-y-6 pb-20">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-green-50 to-white dark:from-dark-surface dark:to-dark-bg p-6 rounded-2xl border border-green-100 dark:border-dark-border transition-colors">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Poli Pemeriksaan</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Daftar pasien yang terdaftar untuk pemeriksaan.</p>
                </div>
                <div className="flex items-center gap-2 text-sm bg-green-100 dark:bg-green-900/30 px-4 py-2 rounded-xl border border-green-200 dark:border-green-800">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-green-600 dark:text-green-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                    <span className="font-bold text-green-700 dark:text-green-300">{patients.length} Pasien</span>
                </div>
            </div>

            {/* Search and Filter Section */}
            <div className="bg-white dark:bg-dark-surface p-2 rounded-2xl shadow-soft dark:shadow-none border border-gray-100 dark:border-dark-border transition-colors flex flex-col md:flex-row gap-2">
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-11 pr-4 py-3.5 border-transparent rounded-xl leading-5 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent sm:text-sm transition-all dark:text-white"
                        placeholder="Cari Nama, Nomor RM, atau Alamat..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                </div>
                
                {/* Date Picker */}
                <div className="md:w-auto w-full">
                     <input 
                        type="date" 
                        value={format(selectedDate, 'yyyy-MM-dd')}
                        onChange={(e) => {
                            if (e.target.value) {
                                setSelectedDate(new Date(e.target.value));
                            }
                        }}
                        className="block w-full md:w-48 px-4 py-3.5 border-transparent rounded-xl leading-5 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent sm:text-sm transition-all shadow-sm"
                     />
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-soft dark:shadow-none border border-gray-100 dark:border-dark-border overflow-hidden transition-colors">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent"></div>
                        <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm font-medium">Sedang memuat data...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800/50">
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pasien</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">No. RM</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Detail</th>
                                    <th scope="col" className="hidden md:table-cell px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Alamat</th>
                                    <th scope="col" className="relative px-6 py-4">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-dark-surface divide-y divide-gray-50 dark:divide-gray-800">
                                {paginatedPatients.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center text-gray-500 dark:text-gray-400">
                                            <div className="flex flex-col items-center">
                                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-full mb-3">
                                                    <svg className="h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                    </svg>
                                                </div>
                                                <p className="font-medium">Tidak ada pasien di poli pemeriksaan.</p>
                                                <p className="text-sm mt-1">Daftarkan pasien baru dengan poli "Pemeriksaan".</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedPatients.map((patient) => (
                                        <tr
                                            key={patient.id}
                                            onClick={() => navigate(`/pemeriksaan/${patient.id}`)}
                                            className="hover:bg-green-50/50 dark:hover:bg-gray-800/50 transition-colors group cursor-pointer"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-11 w-11 flex-shrink-0 rounded-full bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900 dark:to-green-800 flex items-center justify-center text-green-700 dark:text-green-300 font-bold text-sm shadow-sm group-hover:scale-110 transition-transform">
                                                        {patient.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors">
                                                                {patient.name}
                                                            </div>
                                                            {examinationStatus[patient.id] && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                                                                    </svg>
                                                                    Sudah Diperiksa
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                            Masuk Poli: {patient.updatedAt ? format(new Date(patient.updatedAt), 'dd MMM yyyy HH:mm', { locale: localeId }) : '-'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 font-mono">
                                                    {patient.rm}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-gray-200 font-medium">{patient.ageDisplay}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{patient.gender}</div>
                                            </td>
                                            <td className="hidden md:table-cell px-6 py-4">
                                                <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs" title={patient.address}>
                                                    {patient.address}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 rounded-lg text-xs font-bold transition-all mr-2 shadow-sm border border-blue-200 dark:border-blue-800"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCallPatient(patient);
                                                    }}
                                                    title="Panggil Pasien Masuk"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 mr-1">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                                                    </svg>
                                                    MASUK
                                                </button>
                                                <button
                                                    className="p-2 rounded-full text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-gray-800 transition-all mr-2"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/pemeriksaan/${patient.id}`);
                                                    }}
                                                    title="Mulai Pemeriksaan"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    className="p-2 rounded-full text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-all mr-2"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/pasien/${patient.id}`);
                                                    }}
                                                    title="Edit Kunjungan / Pasien"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                    </svg>
                                                </button>
                                                <button
                                                    className="p-2 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveFromQueue(patient.id, patient.name);
                                                    }}
                                                    title="Hapus dari Antrian"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700 dark:text-gray-400">
                                    Halaman <span className="font-bold">{currentPage}</span> dari <span className="font-bold">{totalPages}</span>
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                                >
                                    Sebelumnya
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="relative inline-flex items-center px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                                >
                                    Selanjutnya
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ExaminationList;
