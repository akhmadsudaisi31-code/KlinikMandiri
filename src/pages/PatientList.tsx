import { useState, useEffect, useMemo, useCallback } from 'react';
import { useVisiblePolling } from '../hooks/useVisiblePolling';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Patient } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getExaminationQueueLabel, getExaminationUnitLabel } from '../utils/clinic';
import { broadcastPatientQueueUpdate } from '../utils/patientQueueSync';
import { subscribeDataSync } from '../utils/dataSync';
import { formatToWIB } from '../utils/date';
import { ConfirmationModal } from '../components/ConfirmationModal';

const ITEMS_PER_PAGE = 10;

function PatientList() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    name: '',
    nik: '',
    address: '',
    age: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const { user } = useAuth();
  const examinationUnitLabel = getExaminationUnitLabel(user?.clinicType);
  const examinationQueueLabel = getExaminationQueueLabel(user?.clinicType);

  const fetchPatients = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }

    try {
      let endpoint = '/patients';
      let qName = filters.name.toLowerCase().trim();
      qName = qName.replace(/^(hj\.|h\.|hj|h|ny\.|tn\.|an\.|by\.)\s+/g, '');
      
      const params = new URLSearchParams();
      if (qName) {
        params.append('search', qName);
      } else {
        // Mencegah D1 Timeout Crash: Hanya ambil 100 pasien terbaru jika tidak ada pencarian.
        // Jika butuh pasien lama, user harus menggunakan kotak pencarian nama.
        params.append('page', '1');
        params.append('pageSize', '100');
      }

      const data = await api.get(`${endpoint}?${params.toString()}`);
      setPatients(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error fetching patients: ", e);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [filters.name]);

  // Initial fetch and Debounced search
  useEffect(() => {
    if (user) {
      const delayDebounceFn = setTimeout(() => {
        fetchPatients(true);
      }, 400);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [user, fetchPatients]);

  // Polling hemat D1: hanya jalan saat tab aktif, interval 60 detik
  useVisiblePolling(fetchPatients, 60000);

  // Sync real-time antar tab/device via dataSync
  useEffect(() => {
    const unsubscribe = subscribeDataSync(['patients'], () => fetchPatients());
    return unsubscribe;
  }, [fetchPatients]);

  // State Modal Konfirmasi Hapus
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; patientId: string; patientName: string; isLoading: boolean }>({
    isOpen: false,
    patientId: '',
    patientName: '',
    isLoading: false,
  });

  // State Tong Sampah (Data Pasien Terhapus)
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [trashList, setTrashList] = useState<Patient[]>([]);
  const [trashLoading, setTrashLoading] = useState(false);

  const fetchTrashList = async () => {
    setTrashLoading(true);
    try {
      const data: any = await api.get('/patients/trash');
      setTrashList(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast.error('Gagal memuat data terhapus: ' + (e?.message || 'Error'));
    } finally {
      setTrashLoading(false);
    }
  };

  const handleRestoreFromTrash = async (patientId: string, patientName: string) => {
    try {
      await api.post(`/patients/${patientId}/restore`, {});
      toast.success(`Pasien ${patientName} berhasil dipulihkan!`);
      setTrashList(prev => prev.filter(p => p.id !== patientId));
      fetchPatients();
    } catch (e: any) {
      toast.error('Gagal memulihkan pasien: ' + (e?.message || 'Error'));
    }
  };

  const handleDelete = (patientId: string, patientName: string) => {
    setDeleteModal({
      isOpen: true,
      patientId,
      patientName,
      isLoading: false,
    });
  };

  const confirmDelete = async () => {
    const { patientId, patientName } = deleteModal;
    setDeleteModal(prev => ({ ...prev, isLoading: true }));
    try {
      await api.delete(`/patients/${patientId}`);
      setPatients(prev => prev.filter(p => p.id !== patientId));
      toast.success(`Data pasien ${patientName} berhasil dipindahkan ke riwayat terhapus.`);
      setDeleteModal({ isOpen: false, patientId: '', patientName: '', isLoading: false });
    } catch (error) {
      console.error("Error deleting patient: ", error);
      toast.error("Gagal menghapus data pasien.");
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleAddToPoli = async (patientId: string, patientName: string) => {
    if (window.confirm(`Tambahkan ${patientName} ke ${examinationUnitLabel}?`)) {
      try {
        const queuedAt = new Date().toISOString();
        await api.put(`/patients/${patientId}`, {
          poli: "Pemeriksaan",
          updatedAt: queuedAt
        });
        const existingPatient = patients.find((patient) => patient.id === patientId);
        if (existingPatient) {
          broadcastPatientQueueUpdate({
            action: 'enqueue',
            patientId,
            patient: {
              ...existingPatient,
              poli: 'Pemeriksaan',
              updatedAt: queuedAt,
            },
            source: 'patient-list',
          });
        } else {
          broadcastPatientQueueUpdate({ action: 'refresh', patientId, source: 'patient-list' });
        }

        // Kirim Notifikasi ke Pemeriksa
        try {
          await api.post('/notifications', {
             type: 'NEW_PATIENT',
             patientId: patientId,
             patientName: patientName,
             message: `Pasien: ${patientName} dikirim ke antrian ${examinationQueueLabel}.`,
             read: false,
             createdAt: new Date().toISOString(),
             toRole: 'pemeriksa',
             clinicId: user?.uid
          });
        } catch (error) {
          console.error("Gagal kirim notif:", error);
        }

      } catch (error) {
        console.error("Error updating patient: ", error);
        toast.error(`Gagal menambahkan pasien ke ${examinationUnitLabel}.`);
      }
    }
  };

  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      let qName = filters.name.toLowerCase().trim();
      // Bersihkan gelar/panggilan umum (H., Hj., Ny., Tn., An., By.) di awal pencarian agar pencarian lebih fleksibel
      qName = qName.replace(/^(hj\.|h\.|hj|h|ny\.|tn\.|an\.|by\.)\s+/g, '');

      const qNik = filters.nik.toLowerCase().trim();
      const qAddress = filters.address.toLowerCase().trim();
      const qAge = filters.age.toLowerCase().trim();

      // Bersihkan juga gelar pada nama pasien di database saat membandingkan
      const cleanPatientName = p.name.toLowerCase().replace(/^(hj\.|h\.|hj|h|ny\.|tn\.|an\.|by\.)\s+/g, '');

      const matchName = !qName || cleanPatientName.includes(qName) || p.name.toLowerCase().includes(qName) || p.rm.includes(qName);
      const matchNik = !qNik || ((p as any).nik || '').toLowerCase().includes(qNik);
      const matchAddress = !qAddress || (p.address || '').toLowerCase().includes(qAddress);
      const matchAge = !qAge || (p.ageDisplay || '').toLowerCase().includes(qAge);

      return matchName && matchNik && matchAddress && matchAge;
    });
  }, [patients, filters]);

  const paginatedPatients = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPatients.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPatients, currentPage]);

  const totalPages = Math.ceil(filteredPatients.length / ITEMS_PER_PAGE);

  return (
    <div key="patient-list-container" className="space-y-6 pb-20 font-sans">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-primary-50 to-white dark:from-dark-surface dark:to-dark-bg p-6 rounded-2xl border border-primary-100 dark:border-dark-border transition-colors">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Pendaftaran Pasien</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Kelola data pasien dan riwayat kunjungan klinik.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => {
              setShowTrashModal(true);
              fetchTrashList();
            }}
            className="inline-flex justify-center items-center px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Data Terhapus
          </button>
          <Link
            to="/pendaftaran/baru"
            className="w-full sm:w-auto inline-flex justify-center items-center px-5 py-3 border border-transparent rounded-xl shadow-lg shadow-primary-200 dark:shadow-none text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 hover:-translate-y-0.5 transition-all"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Pasien Baru
          </Link>
        </div>
      </div>

      {/* Multi-Filter Section */}
      <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-soft dark:shadow-none border border-gray-100 dark:border-dark-border transition-colors">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                Filter Pencarian
            </h2>
            {(filters.name || filters.nik || filters.address || filters.age) && (
                <button 
                  onClick={() => setFilters({ name: '', nik: '', address: '', age: '' })}
                  className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    Hapus Filter
                </button>
            )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Nama / RM</label>
            <input
                type="text"
                className="block w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-transparent rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-900 focus:border-transparent text-sm transition-all dark:text-white"
                placeholder="Cari Nama..."
                value={filters.name}
                onChange={(e) => {
                  setFilters({ ...filters, name: e.target.value });
                  setCurrentPage(1);
                }}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">NIK</label>
            <input
                type="text"
                className="block w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-transparent rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-900 focus:border-transparent text-sm transition-all dark:text-white"
                placeholder="Cari NIK..."
                value={filters.nik}
                onChange={(e) => {
                  setFilters({ ...filters, nik: e.target.value });
                  setCurrentPage(1);
                }}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Alamat</label>
            <input
                type="text"
                className="block w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-transparent rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-900 focus:border-transparent text-sm transition-all dark:text-white"
                placeholder="Cari Alamat..."
                value={filters.address}
                onChange={(e) => {
                  setFilters({ ...filters, address: e.target.value });
                  setCurrentPage(1);
                }}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Usia</label>
            <input
                type="text"
                className="block w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-transparent rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-900 focus:border-transparent text-sm transition-all dark:text-white"
                placeholder="Cari Usia..."
                value={filters.age}
                onChange={(e) => {
                  setFilters({ ...filters, age: e.target.value });
                  setCurrentPage(1);
                }}
            />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-soft dark:shadow-none border border-gray-100 dark:border-dark-border overflow-hidden transition-colors">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm font-medium">Sedang memuat data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50">
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pasien</th>
                  <th scope="col" className="hidden sm:table-cell px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">No. RM</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Detail</th>
                  <th scope="col" className="hidden lg:table-cell px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Alamat</th>
                  <th scope="col" className="px-6 py-4 sticky-action-col text-center">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aksi</span>
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
                        <p className="font-medium">Tidak ada data pasien ditemukan.</p>
                        <p className="text-sm mt-1">Coba kata kunci lain atau tambahkan pasien baru.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedPatients.map((patient) => (
                    <tr
                      key={patient.id}
                      onClick={() => navigate(`/pasien/${patient.id}`)}
                      className="hover:bg-blue-50/50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-11 w-11 flex-shrink-0 rounded-full bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-sm shadow-sm group-hover:scale-110 transition-transform">
                            {patient.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                              <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">
                                {patient.name}
                              </span>
                              {patient.allergies && (
                                <span className="flex-shrink-0 inline-flex items-center justify-center p-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg animate-pulse" title={`Alergi: ${patient.allergies}`}>
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                  </svg>
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-black bg-gray-50 dark:bg-gray-800 text-gray-500 px-3 py-1 rounded-full uppercase tracking-widest">
                              Terdaftar: {formatToWIB(patient.createdAt)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 font-mono">
                          {patient.rm}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                             <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                patient.poli === 'Pemeriksaan' 
                                  ? 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/30 animate-pulse' 
                                  : patient.poli === 'Selesai'
                                  ? 'bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30'
                                  : 'bg-primary-50 text-primary-600 border-primary-100 dark:bg-primary-900/10 dark:text-primary-400 dark:border-primary-900/20'
                             }`}>
                               {patient.poli === 'Pemeriksaan' 
                                  ? examinationQueueLabel 
                                  : patient.poli === 'Selesai' 
                                  ? 'Sudah Diperiksa' 
                                  : patient.poli}
                             </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-200 font-medium">{patient.ageDisplay}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{patient.gender}</div>
                      </td>
                      <td className="hidden lg:table-cell px-6 py-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs" title={patient.address}>
                          {patient.address}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium sticky-action-col">
                        <button
                          className="p-2 rounded-full text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-gray-800 transition-all mr-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToPoli(patient.id, patient.name);
                          }}
                          title="Tambah ke Poli Pemeriksaan"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                          </svg>
                        </button>
                        <button
                          className="p-2 rounded-full text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-gray-800 transition-all mr-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/pasien/${patient.id}`);
                          }}
                          title="Lihat Detail"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </button>
                        <button
                          className="p-2 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(patient.id, patient.name);
                          }}
                          title="Hapus Pasien"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
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

      {/* Modal Konfirmasi Hapus Pasien */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => {
          if (!deleteModal.isLoading) {
            setDeleteModal({ isOpen: false, patientId: '', patientName: '', isLoading: false });
          }
        }}
        onConfirm={confirmDelete}
        title="Hapus Data Pasien?"
        message={`Yakin ingin menghapus pasien "${deleteModal.patientName}"? Pasien akan dipindahkan ke riwayat data terhapus dan dapat dipulihkan sewaktu-waktu.`}
        confirmLabel="Ya, Hapus Pasien"
        cancelLabel="Batal"
        variant="danger"
        isLoading={deleteModal.isLoading}
      />

      {/* Modal Tong Sampah (Data Terhapus) */}
      {showTrashModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 dark:border-dark-border">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Riwayat Pasien Terhapus
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Daftar pasien yang pernah dihapus. Anda dapat memulihkannya kembali kapan saja.
                </p>
              </div>
              <button
                onClick={() => setShowTrashModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {trashLoading ? (
                <div className="py-12 text-center text-sm text-gray-400 animate-pulse">
                  Memuat data pasien terhapus...
                </div>
              ) : trashList.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm font-medium text-gray-400">Tidak ada data pasien yang terhapus.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {trashList.map((p: any) => (
                    <div key={p.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 dark:text-white text-sm">
                            {p.name}
                          </span>
                          <span className="font-mono text-xs text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded">
                            {p.rm || '-'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {p.address ? `Alamat: ${p.address}` : 'Tidak ada alamat'} 
                          {p.deletedAt && ` • Dihapus: ${formatToWIB(p.deletedAt)}`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRestoreFromTrash(p.id, p.name)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Pulihkan Pasien
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 flex justify-end">
              <button
                onClick={() => setShowTrashModal(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientList;
