import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format, addMonths, addYears } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { SUBSCRIPTION_PLANS } from '../types';
import { subscribeDataSync } from '../utils/dataSync';
import { formatToWIB } from '../utils/date';

interface ClinicEntry {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: 'pending' | 'active' | 'inactive' | 'rejected';
    subscriptionPlan: string;
    clinicType?: string;
    validUntil?: string;
    createdAt: string;
    lastLoginAt?: string;
    tier?: string;
}

function formatValidUntil(validUntil?: string) {
  if (!validUntil) return 'Belum diatur';

  const validUntilDate = new Date(validUntil);
  if (Number.isNaN(validUntilDate.getTime())) return 'Belum diatur';

  if (validUntilDate.getFullYear() >= 2100) {
    return 'Aktif sangat panjang';
  }

  return format(validUntilDate, 'dd MMM yyyy', { locale: localeId });
}

function AdminDashboard() {
  const { user, loading: authLoading, login: userLogin } = useAuth();
  const [clinics, setClinics] = useState<ClinicEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'clinics' | 'plans' | 'addons' | 'errorlogs'>('clinics');

  // Error Logs State
  const [errorLogs, setErrorLogs] = useState<any[]>([]);
  const [errorLogsLoading, setErrorLogsLoading] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [errorLogFilter, setErrorLogFilter] = useState('');
  const [errorPagination, setErrorPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const fetchErrorLogs = async (page = 1) => {
    setErrorLogsLoading(true);
    try {
      const res: any = await api.get(`/errors?page=${page}&limit=20`);
      setErrorLogs(res.data || []);
      setErrorPagination(res.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (e) {
      setErrorLogs([]);
    } finally {
      setErrorLogsLoading(false);
    }
  };

  const deleteErrorLog = async (id: string) => {
    if(!confirm('Hapus log error ini?')) return;
    try {
      await api.delete(`/errors/${id}`);
      toast.success('Log dihapus');
      fetchErrorLogs(errorPagination.page);
    } catch(e) {
      toast.error('Gagal menghapus log');
    }
  };

  const clearAllErrorLogs = async () => {
    if(!confirm('⚠️ PERINGATAN: Hapus SEMUA log error yang ada? Tindakan ini tidak dapat dibatalkan.')) return;
    try {
      await api.delete('/errors/clear-all');
      toast.success('Semua log telah dibersihkan');
      fetchErrorLogs(1);
    } catch(e) {
      toast.error('Gagal membersihkan log');
    }
  };


  // SaaS Data
  const [plans, setPlans] = useState<any[]>([]);
  const [addons, setAddons] = useState<any[]>([]);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClinic, setEditingClinic] = useState<ClinicEntry | null>(null);
  const [editForm, setEditForm] = useState({ 
      enabledFeatures: { anc: false, kb: false, immunization: false, dental: false, lab: false, reports: false, eye: false, systemic_physic: false, medicines: false, lab_upload: false },
      maxPatients: 0,
      maxUsers: 0,
      tier: 'STANDARD'
  });

  // Broadcast History State
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [broadcastsLoading, setBroadcastsLoading] = useState(false);

  const fetchBroadcasts = async () => {
    setBroadcastsLoading(true);
    try {
      const data: any = await api.get('/admin/broadcasts');
      setBroadcasts(data || []);
    } catch (e) {
      console.error("Failed to fetch broadcasts", e);
    } finally {
      setBroadcastsLoading(false);
    }
  };

  const deleteBroadcast = async (id: string) => {
    if (!confirm('Hapus broadcast ini?')) return;
    try {
      await api.delete(`/admin/broadcasts/${id}`);
      toast.success('Broadcast dihapus');
      fetchBroadcasts();
    } catch (e) {
      toast.error('Gagal menghapus broadcast');
    }
  };

  // Activity Modal State
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activityStats, setActivityStats] = useState<any>(null);
  const [activityClinicName, setActivityClinicName] = useState('');
  const [activityLoading, setActivityLoading] = useState(false);

  // Reset Database State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const fetchClinics = async () => {
    try {
      const data: any = await api.get('/admin/clinics');
      setClinics(data || []);
    } catch (e) {
      toast.error('Gagal mengambil data klinik');
    } finally {
      setLoading(false);
    }
  };

  const fetchSaaSData = async () => {
    try {
      const [p, a]: any = await Promise.all([
          api.get('/admin/plans'),
          api.get('/admin/addons')
      ]);
      setPlans(p || []);
      setAddons(a || []);
    } catch (e) {
      console.error("SaaS Data Fetch Error:", e);
    }
  };

  useEffect(() => {
    if (user && user.isAdmin === 1) {
      fetchClinics();
      fetchSaaSData();

      const unsubscribe = subscribeDataSync(['admin-clinics'], () => {
        fetchClinics();
      });

      if (activeTab === 'broadcast') {
        fetchBroadcasts();
      }

      return () => {
        unsubscribe();
      };
    }
  }, [user, activeTab]);

  const handleActivate = async (id: string) => {
    if (!window.confirm('Aktifkan klinik ini? Email notifikasi akan dikirimkan.')) return;
    try {
      await api.put(`/admin/clinics/${id}/activate`, {});
      toast.success('Klinik berhasil diaktifkan');
      fetchClinics();
    } catch (e) {
      toast.error('Gagal mengaktifkan klinik');
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm('Tolak aktivasi klinik ini? Akun akan ditolak dan email penolakan akan dikirimkan.')) return;
    try {
      await api.put(`/admin/clinics/${id}/reject`, {});
      toast.success('Klinik berhasil ditolak');
      fetchClinics();
    } catch (e) {
      toast.error('Gagal menolak klinik');
    }
  };

  const handleImpersonate = async (id: string, name: string) => {
    if (!window.confirm(`Masuk sebagai klinik ${name}?`)) return;
    try {
      const data: any = await api.post(`/admin/impersonate/${id}`, {});
      if (data.token && data.user) {
          userLogin(data.token, data.user);
          toast.success(`Berhasil masuk sebagai ${name}`);
          window.location.href = '/'; // Redirect to dashboard
      }
    } catch (e) {
      toast.error('Gagal masuk ke akun klinik');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Hapus klinik ${name} permanen? Semua data pasien dan rekam medis juga akan terhapus dan tindakan ini tidak dapat dibatalkan!`)) return;
    try {
      await api.delete(`/admin/clinics/${id}`);
      toast.success('Klinik berhasil dihapus');
      fetchClinics();
    } catch (e) {
      toast.error('Gagal menghapus klinik');
    }
  };

  const handleEditClick = async (clinic: ClinicEntry) => {
    setEditingClinic(clinic);
    setIsEditModalOpen(true);
    
    // Default form
    setEditForm({
      name: clinic.name,
      email: clinic.email,
      phone: clinic.phone || '',
      subscriptionPlan: clinic.subscriptionPlan || 'YEARLY',
      tier: clinic.tier || 'STANDARD',
      validUntil: clinic.validUntil ? clinic.validUntil.split('T')[0] : '',
      enabledFeatures: { anc: false, kb: false, immunization: false, dental: false, lab: false, reports: false, eye: false, systemic_physic: false, medicines: false, lab_upload: false },
      maxPatients: (clinic as any).maxPatients || 0,
      maxUsers: (clinic as any).maxUsers || 0
    });

    try {
        const features: any = await api.get(`/admin/clinics/${clinic.id}/features`);
        setEditForm(prev => ({ ...prev, enabledFeatures: { ...prev.enabledFeatures, ...features } }));
    } catch (e) {
        console.error("Gagal mengambil fitur klinik:", e);
    }
  };

  const handleUpdateClinic = async () => {
    if (!editingClinic) return;
    try {
      await Promise.all([
          api.put(`/admin/clinics/${editingClinic.id}`, {
              name: editForm.name,
              email: editForm.email,
              phone: editForm.phone,
              subscriptionPlan: editForm.subscriptionPlan,
              tier: editForm.tier,
              validUntil: editForm.validUntil,
              maxPatients: editForm.maxPatients,
              maxUsers: editForm.maxUsers
          }),
          api.put(`/admin/clinics/${editingClinic.id}/features`, editForm.enabledFeatures)
      ]);
      toast.success('Data profil dan fitur klinik berhasil diperbarui');
      setIsEditModalOpen(false);
      setEditingClinic(null);
      fetchClinics();
    } catch (e) {
      toast.error('Gagal memperbarui data klinik');
    }
  };

  const handleDemoValidity = async (id: string, name: string, modifier: string, actionName: string) => {
      if (!window.confirm(`Lakukan aksi "${actionName}" untuk klinik ${name}?`)) return;
      try {
          await api.put(`/admin/clinics/${id}/validity`, { modifier });
          toast.success(`Aksi ${actionName} sukses`);
          fetchClinics();
      } catch (e) {
          toast.error(`Gagal melakukan aksi ${actionName}`);
      }
  };

  const handleActivityClick = async (clinic: ClinicEntry) => {
      setActivityClinicName(clinic.name);
      setIsActivityModalOpen(true);
      setActivityLoading(true);
      try {
          const data: any = await api.get(`/admin/clinics/${clinic.id}/activity`);
          setActivityStats(data);
      } catch (e) {
          toast.error('Gagal mengambil data aktivitas');
          setIsActivityModalOpen(false);
      } finally {
          setActivityLoading(false);
      }
  };

  const handleResetDatabase = async () => {
      if (resetConfirmation !== 'RESET') {
          toast.error('Ketik RESET untuk mengonfirmasi penghapusan data');
          return;
      }
      setIsResetting(true);
      try {
          await api.delete('/admin/system/reset', { data: { confirmation: 'RESET' } });
          toast.success('Database berhasil direset!');
          setIsResetModalOpen(false);
          setResetConfirmation('');
          fetchClinics();
      } catch (e: any) {
          toast.error(e.message || 'Gagal mereset database');
      } finally {
          setIsResetting(false);
      }
  };

  if (authLoading) return null;
  if (!user || user.isAdmin !== 1) return <Navigate to="/" replace />;

  const renderActionButtons = (clinic: ClinicEntry) => (
      <div className="flex items-center justify-end gap-2 flex-wrap sm:flex-nowrap">
          {/* Activity Stats Icon */}
          <button
              onClick={() => handleActivityClick(clinic)}
              title="Statistik Aktivitas Klinik"
              className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 rounded-lg transition-colors"
          >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
          </button>

          {/* Masuk ke akun klinik */}
          <button
              onClick={() => handleImpersonate(clinic.id, clinic.name)}
              title="Masuk ke akun klinik"
              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/40 rounded-lg transition-colors"
          >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
          </button>

          {/* Edit Button */}
          <button
              onClick={() => handleEditClick(clinic)}
              title="Edit Profil/Paket Klinik"
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
          >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
              </svg>
          </button>

          {/* Demo Expiration Actions */}
          {clinic.status === 'active' && (
            <>
              <button
                  onClick={() => handleDemoValidity(clinic.id, clinic.name, '+3 days', 'Demo Peringatan')}
                  title="Demo Peringatan (Set 3 Hari)"
                  className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/40 rounded-lg transition-colors"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
              </button>
              <button
                  onClick={() => handleDemoValidity(clinic.id, clinic.name, '-1 day', 'Akhiri Langganan')}
                  title="Akhiri Langganan (Set Expired)"
                  className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/40 rounded-lg transition-colors"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
              </button>
            </>
          )}

          {/* Delete Button */}
          <button
              onClick={() => handleDelete(clinic.id, clinic.name)}
              title="Hapus Klinik"
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-lg transition-colors"
          >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
          </button>

          {/* Pending State */}
          {clinic.status === 'pending' && (
              <>
                  <button
                      onClick={() => handleReject(clinic.id)}
                      title="Tolak Aktivasi"
                      className="bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-black px-3 py-2 rounded-xl transition-all shadow-sm flex items-center justify-center whitespace-nowrap"
                  >
                      TOLAK
                  </button>
                  <button
                      onClick={() => handleActivate(clinic.id)}
                      className="bg-primary-600 hover:bg-primary-700 text-white text-[10px] font-black px-4 py-2 rounded-xl transition-all shadow-lg shadow-primary-500/10 uppercase tracking-widest whitespace-nowrap"
                  >
                      Aktifkan
                  </button>
              </>
          )}
          
          {/* Active State */}
          {clinic.status === 'active' && (
              <span className="text-green-500 bg-green-50 dark:bg-green-900/30 p-1.5 rounded-full inline-flex items-center justify-center ml-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
              </span>
          )}

          {/* Rejected State */}
          {clinic.status === 'rejected' && (
              <span className="text-red-500 bg-red-50 dark:bg-red-900/30 p-1.5 rounded-full inline-flex items-center justify-center ml-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
              </span>
          )}
      </div>
  );

  return (
    <div className="space-y-6 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-8 rounded-3xl text-white shadow-2xl">
        <h1 className="text-3xl font-black uppercase tracking-tighter">Panel <span className="text-primary-400">Administrator</span></h1>
        <p className="text-gray-400 text-sm font-bold mt-1 uppercase tracking-widest">Kelola aktivasi, masa aktif, dan akses klinik</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-white dark:bg-gray-800 p-1.5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 w-fit">
          <button 
            onClick={() => setActiveTab('clinics')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'clinics' ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
              Data Klinik
          </button>
          <button 
            onClick={() => setActiveTab('plans')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'plans' ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
              Paket SaaS
          </button>
          <button 
            onClick={() => setActiveTab('addons')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'addons' ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
              Add-ons
          </button>
          <button 
            onClick={() => setActiveTab('roadmap')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'roadmap' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
              🚀 Roadmap
          </button>
          <button 
            onClick={() => setActiveTab('broadcast')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'broadcast' ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/20' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
              📣 Broadcast
          </button>
          <button 
            onClick={() => { setActiveTab('errorlogs'); fetchErrorLogs(1); }}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'errorlogs' ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            🔴 Error Logs
          </button>
      </div>

      <div className="bg-white dark:bg-dark-surface p-6 rounded-3xl shadow-soft dark:shadow-none border border-gray-100 dark:border-dark-border">
        {activeTab === 'clinics' ? (
            loading ? (
                <div className="text-center py-20 font-black text-gray-300 uppercase tracking-widest animate-pulse">Memuat data klinik...</div>
           ) : (
             <>
             {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Klinik</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Kontak</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Jenis Klinik</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Tier</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Paket</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Aktif Sampai</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-black text-gray-400 uppercase tracking-widest">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {clinics.map((clinic) => (
                  <tr key={clinic.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                        <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{clinic.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold">{clinic.email}</p>
                        <p className="text-[9px] text-gray-300 italic mt-1 font-mono">ID: {clinic.id.slice(0, 8)}...</p>
                    </td>
                    <td className="px-6 py-4">
                         <p className="text-xs font-black text-gray-700 dark:text-gray-300">{clinic.phone}</p>
                         <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                             {formatToWIB(clinic.createdAt)}
                         </p>
                    </td>
                    <td className="px-6 py-4">
                        <span className="text-[10px] font-black bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full uppercase tracking-widest">
                            {clinic.clinicType || '-'}
                        </span>
                    </td>
                    <td className="px-6 py-4">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                            clinic.tier === 'PRO' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' :
                            clinic.tier === 'STANDARD' ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-600' :
                            'bg-slate-50 dark:bg-slate-800 text-slate-500'
                        }`}>
                            {clinic.tier || 'STANDARD'}
                        </span>
                    </td>
                    <td className="px-6 py-4">
                        <span className="text-[10px] font-black bg-primary-100 dark:bg-primary-900/30 text-primary-600 px-3 py-1 rounded-full uppercase tracking-widest">
                            {SUBSCRIPTION_PLANS.find(p => p.id === clinic.subscriptionPlan)?.name || clinic.subscriptionPlan}
                        </span>
                    </td>
                    <td className="px-6 py-4">
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                            {formatValidUntil(clinic.validUntil)}
                        </span>
                    </td>
                    <td className="px-6 py-4">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                            clinic.status === 'active' 
                            ? 'bg-green-100 text-green-600' 
                            : clinic.status === 'rejected'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-yellow-100 text-yellow-600'
                        }`}>
                            {clinic.status}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                        {renderActionButtons(clinic)}
                    </td>
                  </tr>
                ))}
                {clinics.length === 0 && (
                     <tr>
                         <td colSpan={7} className="text-center py-20 text-gray-300 font-black uppercase tracking-widest">Tidak Ada Klinik Terdaftar</td>
                     </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {clinics.map((clinic) => (
                <div key={clinic.id} className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col gap-4 relative overflow-hidden">
                    <div className={`absolute top-0 right-0 w-2 h-full ${
                        clinic.status === 'active' ? 'bg-green-500' :
                        clinic.status === 'rejected' ? 'bg-red-500' :
                        'bg-yellow-500'
                    }`}></div>
                    
                    <div>
                        <div className="flex justify-between items-start mr-4">
                            <div>
                                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight leading-tight">{clinic.name}</h3>
                                <p className="text-xs text-primary-600 font-bold mb-1">{clinic.phone}</p>
                            </div>
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shrink-0 ${
                                clinic.status === 'active' 
                                ? 'bg-green-100 text-green-600' 
                                : clinic.status === 'rejected'
                                ? 'bg-red-100 text-red-600'
                                : 'bg-yellow-100 text-yellow-600'
                            }`}>
                                {clinic.status}
                            </span>
                        </div>
                        <p className="text-[11px] text-gray-500">{clinic.email}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-black bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full uppercase tracking-widest border border-blue-100 dark:border-blue-900/50">
                            Jenis: {clinic.clinicType || '-'}
                        </span>
                        <span className="text-[10px] font-black bg-primary-50 dark:bg-primary-900/20 text-primary-600 px-3 py-1 rounded-full uppercase tracking-widest border border-primary-100 dark:border-primary-900/50">
                            Paket: {SUBSCRIPTION_PLANS.find(p => p.id === clinic.subscriptionPlan)?.name || clinic.subscriptionPlan}
                        </span>
                        <span className="text-[10px] font-black bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-100 dark:border-emerald-900/50">
                            Aktif sampai: {formatValidUntil(clinic.validUntil)}
                        </span>
                        <span className="text-[10px] font-black bg-gray-50 dark:bg-gray-800 text-gray-500 px-3 py-1 rounded-full uppercase tracking-widest">
                            Terdaftar: {formatToWIB(clinic.createdAt)}
                        </span>
                    </div>

                    <div className="pt-3 mt-1 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                        {renderActionButtons(clinic)}
                    </div>
                </div>
            ))}
            
            {clinics.length === 0 && (
                <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-2xl text-gray-400 font-black uppercase tracking-widest">
                    Tidak Ada Klinik Terdaftar
                </div>
            )}
          </div>
          </>
          )
        ) : activeTab === 'plans' ? (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-black uppercase tracking-tight">Daftar Paket Sistem</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map(plan => (
                        <div key={plan.id} className="p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-black uppercase">{plan.name}</h3>
                                <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-2 py-1 rounded uppercase tracking-tighter">ID: {plan.id}</span>
                            </div>
                            <div className="space-y-2 mb-6 text-sm text-gray-600 dark:text-gray-400">
                                <p>Monthly: <strong>Rp {plan.price_monthly?.toLocaleString()}</strong></p>
                                <p>Yearly: <strong>Rp {plan.price_yearly?.toLocaleString()}</strong></p>
                            </div>
                            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Fitur Aktif:</p>
                                <div className="flex flex-wrap gap-1">
                                    {Object.entries(JSON.parse(plan.features_json || '{}'))
                                      .filter(([_, val]) => val === true)
                                      .map(([key]) => (
                                        <span key={key} className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-md font-bold uppercase">{key}</span>
                                      ))
                                    }
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-gray-400 italic font-medium">* Untuk saat ini, penambahan paket baru dilakukan via migrasi database SQL.</p>
            </div>
        ) : activeTab === 'roadmap' ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-indigo-600 p-8 rounded-3xl text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-2xl font-black uppercase tracking-tight">CMS Roadmap & Masukan</h2>
                        <p className="text-indigo-100 text-sm font-medium mt-1">Ide pengembangan CMS pusat untuk optimalisasi manajemen client SaaS</p>
                    </div>
                    <svg className="absolute -right-10 -bottom-10 w-64 h-64 text-indigo-500/20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Prioritas Pengembangan</h3>
                        {[
                            { title: 'Feature Tier Presets', desc: 'Bundling fitur ke dalam kategori Basic, Standard, & Professional untuk kemudahan aktivasi masal.', status: 'PLANNING', icon: '📦' },
                            { title: 'Impersonation Mode', desc: 'Sudah diimplementasikan—Memungkinkan admin login sebagai client untuk membantu troubleshooting.', status: 'DONE', icon: '👤' },
                            { title: 'Usage Analytics per Client', desc: 'Melihat grafik penggunaan fitur (misal: jumlah pasien, resep) untuk dasar penentuan biaya.', status: 'IDEA', icon: '📊' },
                            { title: 'Client Quota System', desc: 'Membatasi jumlah record (pasien/user) sesuai paket yang dibeli.', status: 'PLANNING', icon: '🔒' },
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4 p-5 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-indigo-300 transition-all">
                                <span className="text-2xl">{item.icon}</span>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="text-sm font-black uppercase">{item.title}</h4>
                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${item.status === 'DONE' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>{item.status}</span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Saran Optimasi Bisnis</h3>
                        <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-900/30 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">💡</div>
                                <h4 className="text-sm font-black text-emerald-800 dark:text-emerald-400 uppercase">Tips Up-selling Fitur</h4>
                            </div>
                            <ul className="space-y-3">
                                {[
                                    'Berikan masa trial 7 hari untuk fitur Premium (misal: Poli Mata/Gigi).',
                                    'Buat fitur "Laporan Lanjutan" sebagai add-on berbayar di luar paket utama.',
                                    'Implementasi "White Labeling" (ganti logo/domain) untuk klien institusi besar.',
                                    'Tawarkan integrasi API BPJS/SatuSehat sebagai paket Enterprise.',
                                ].map((tip, i) => (
                                    <li key={i} className="flex gap-3 text-[11px] text-emerald-700 dark:text-emerald-300 font-bold leading-relaxed">
                                        <span className="text-emerald-500 mt-0.5">✔</span>
                                        {tip}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center py-10">
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Ingin menambah fitur lain?</p>
                            <p className="text-[10px] text-gray-400 italic mb-4">"Kembangkan CMS ini secara bertahap sesuai feedback nyata dari dokter/bidan di lapangan."</p>
                        </div>
                    </div>
                </div>
            </div>
        ) : activeTab === 'broadcast' ? (
            <div className="space-y-8 py-10 animate-in fade-in slide-in-from-top-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-orange-100/50">📣</div>
                            <h2 className="text-2xl font-black uppercase tracking-tight">Kirim Pengumuman Global</h2>
                            <p className="text-gray-400 text-sm font-medium">Pesan ini akan muncul di dashboard semua klien yang sedang aktif.</p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Isi Pengumuman</label>
                                <textarea 
                                    id="broadcast-msg"
                                    rows={4}
                                    placeholder="Tulis informasi pembaruan fitur atau berita penting lainnya di sini..."
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 rounded-2xl text-sm font-bold focus:border-orange-500 outline-none transition-all resize-none"
                                />
                            </div>
                            <button 
                                onClick={async () => {
                                    const msg = (document.getElementById('broadcast-msg') as HTMLTextAreaElement).value;
                                    if(!msg) return toast.error('Pesan tidak boleh kosong');
                                    try {
                                        await api.post('/admin/broadcast', { message: msg });
                                        toast.success('Pengumuman berhasil dikirim!');
                                        (document.getElementById('broadcast-msg') as HTMLTextAreaElement).value = '';
                                        fetchBroadcasts();
                                    } catch(e) {
                                        toast.error('Gagal mengirim broadcast');
                                    }
                                }}
                                className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-orange-500/20 transition-all active:scale-95"
                            >
                                Kirim Sekarang 🚀
                            </button>
                        </div>
                        
                        <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex gap-4 items-center">
                            <span className="text-xl">ℹ️</span>
                            <p className="text-[11px] text-blue-700 dark:text-blue-400 font-bold leading-relaxed italic">Broadcast akan langsung tampil di banner atas dashboard klien secara real-time.</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex justify-between items-end">
                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Riwayat Broadcast</h3>
                                <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">Daftar pesan yang pernah dikirim</p>
                            </div>
                            <button onClick={fetchBroadcasts} className="text-[10px] font-black text-primary-600 uppercase hover:underline">Refresh</button>
                        </div>

                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {broadcastsLoading ? (
                                <div className="text-center py-10 animate-pulse text-gray-300 font-black uppercase tracking-widest">Memuat riwayat...</div>
                            ) : broadcasts.length === 0 ? (
                                <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-700 text-gray-400">
                                    <p className="text-xs font-black uppercase tracking-widest">Belum ada riwayat broadcast</p>
                                </div>
                            ) : (
                                broadcasts.map((b: any) => (
                                    <div key={b.id} className="group bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:border-orange-200 transition-all">
                                        <div className="flex justify-between items-start gap-4 mb-3">
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{formatToWIB(b.createdAt)}</span>
                                            <button 
                                                onClick={() => deleteBroadcast(b.id)}
                                                className="text-gray-300 hover:text-red-500 transition-colors"
                                                title="Hapus Pesan"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                        <p className="text-sm font-bold text-gray-700 dark:text-gray-200 leading-relaxed">{b.message}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        ) : activeTab === 'errorlogs' ? (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  Error Logs
                </h2>
                <p className="text-xs text-gray-400 font-medium mt-0.5">Memantau stabilitas sistem • {errorPagination.total} log terdeteksi</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <input 
                  type="text" 
                  placeholder="Filter pesan / klinik..." 
                  value={errorLogFilter}
                  onChange={e => setErrorLogFilter(e.target.value)}
                  className="px-4 py-2 text-xs border-2 border-gray-100 dark:border-gray-700 rounded-xl dark:bg-gray-800 dark:text-white w-full md:w-48 outline-none focus:border-primary-500 transition-all"
                />
                <button 
                  onClick={() => fetchErrorLogs(errorPagination.page)}
                  className="px-4 py-2 text-xs font-black bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 transition-all active:scale-95"
                >↻ REFRESH</button>
                <button 
                  onClick={clearAllErrorLogs}
                  className="px-4 py-2 text-xs font-black bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 transition-all active:scale-95 border border-red-100 dark:border-red-900/50"
                >🗑️ BERSIHKAN SEMUA</button>
              </div>
            </div>

            {errorLogsLoading ? (
              <div className="text-center py-24">
                  <div className="w-12 h-12 border-4 border-gray-100 border-t-red-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-xs font-black text-gray-300 uppercase tracking-[0.2em]">Sinkronisasi Log...</p>
              </div>
            ) : errorLogs.length === 0 ? (
              <div className="text-center py-24 bg-gray-50 dark:bg-gray-800/30 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-700">
                  <span className="text-4xl mb-4 block">✨</span>
                  <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Sistem dalam kondisi prima. Tidak ada error.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {errorLogs
                  .filter(log => !errorLogFilter || 
                    (log.clinicId || '').toLowerCase().includes(errorLogFilter.toLowerCase()) ||
                    (log.errorMessage || '').toLowerCase().includes(errorLogFilter.toLowerCase()) ||
                    (log.userEmail || '').toLowerCase().includes(errorLogFilter.toLowerCase())
                  )
                  .map((log: any) => (
                  <div key={log.id} className={`group bg-white dark:bg-gray-800 rounded-2xl border-2 transition-all ${expandedLogId === log.id ? 'border-red-500 shadow-lg shadow-red-500/5' : 'border-gray-50 dark:border-gray-700 hover:border-gray-200'}`}>
                    <div 
                      className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 cursor-pointer"
                      onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black bg-red-100 text-red-600 px-2 py-0.5 rounded uppercase tracking-tighter shrink-0">CRITICAL</span>
                            <p className="text-sm font-black text-gray-900 dark:text-white truncate tracking-tight">{log.errorMessage || '(no message)'}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                          <div className="flex items-center gap-1.5">
                             <div className="w-4 h-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-[8px]">🏥</div>
                             <span className="text-[10px] text-gray-500 font-bold">{log.clinicId}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                             <div className="w-4 h-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-[8px]">🔗</div>
                             <span className="text-[10px] text-gray-400 font-medium truncate max-w-[200px]">{log.url}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                            <p className="text-[10px] text-gray-900 dark:text-gray-100 font-black">{log.createdAt ? new Date(log.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase">{log.createdAt ? new Date(log.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}</p>
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); deleteErrorLog(log.id); }}
                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                        </button>
                      </div>
                    </div>
                    {expandedLogId === log.id && (
                      <div className="px-5 pb-6 border-t border-gray-100 dark:border-gray-700/50 pt-5 space-y-5 animate-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Identitas User</p>
                                <p className="text-xs font-black text-gray-900 dark:text-white truncate">{log.userEmail || '-'}</p>
                                <p className="text-[9px] text-gray-400 font-bold mt-0.5">UID: {log.userId || '-'}</p>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Waktu Kejadian</p>
                                <p className="text-xs font-black text-gray-900 dark:text-white">{log.createdAt ? new Date(log.createdAt).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' }) : '-'}</p>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Browser / OS</p>
                                <p className="text-[10px] font-bold text-gray-600 dark:text-gray-400 leading-relaxed truncate" title={log.userAgent}>{log.userAgent || '-'}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                             <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                             Stack Trace / Jejak Error
                          </p>
                          <pre className="text-[11px] font-mono text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-5 rounded-2xl overflow-x-auto whitespace-pre-wrap break-words max-h-64 border border-gray-100 dark:border-gray-800 leading-relaxed">{log.errorStack || '(tidak ada stack trace)'}</pre>
                        </div>
                        
                        {log.metadata && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Metadata / Payload Tambahan</p>
                            <pre className="text-[11px] font-mono text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-2xl overflow-x-auto whitespace-pre-wrap break-words border border-blue-100 dark:border-blue-900/30 leading-relaxed">
                              {typeof log.metadata === 'string' ? log.metadata : JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Pagination Controls */}
                <div className="pt-6 flex items-center justify-between border-t border-gray-100 dark:border-gray-800 mt-6">
                    <p className="text-xs font-bold text-gray-400">
                        Halaman <span className="text-gray-900 dark:text-white font-black">{errorPagination.page}</span> dari <span className="text-gray-900 dark:text-white font-black">{errorPagination.totalPages}</span>
                    </p>
                    <div className="flex gap-2">
                        <button 
                            disabled={errorPagination.page <= 1 || errorLogsLoading}
                            onClick={() => fetchErrorLogs(errorPagination.page - 1)}
                            className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            ← Sebelumnya
                        </button>
                        <button 
                            disabled={errorPagination.page >= errorPagination.totalPages || errorLogsLoading}
                            onClick={() => fetchErrorLogs(errorPagination.page + 1)}
                            className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-primary-600 text-white rounded-xl shadow-lg shadow-primary-500/20 hover:bg-primary-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            Berikutnya →
                        </button>
                    </div>
                </div>
              </div>
            )}
          </div>
        ) : (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-black uppercase tracking-tight">Daftar Add-ons</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {addons.map(addon => (
                        <div key={addon.id} className="p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-black uppercase mb-1">{addon.name}</h3>
                            <p className="text-[10px] font-black text-blue-600 uppercase mb-4">Key: {addon.feature_key}</p>
                            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                <p>Monthly: <strong>Rp {addon.price_monthly?.toLocaleString()}</strong></p>
                                <p>Yearly: <strong>Rp {addon.price_yearly?.toLocaleString()}</strong></p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editingClinic && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Edit Klinik</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Klinik</label>
                <input 
                  type="text" 
                  value={editForm.name} 
                  onChange={e => setEditForm({...editForm, name: e.target.value})} 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input 
                  type="email" 
                  value={editForm.email} 
                  onChange={e => setEditForm({...editForm, email: e.target.value})} 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No. WhatsApp</label>
                <input 
                  type="text" 
                  value={editForm.phone} 
                  onChange={e => setEditForm({...editForm, phone: e.target.value})} 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Paket Langganan</label>
                <select 
                  value={editForm.subscriptionPlan} 
                  onChange={e => setEditForm({...editForm, subscriptionPlan: e.target.value})} 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {SUBSCRIPTION_PLANS.map(plan => (
                    <option key={plan.id} value={plan.id}>{plan.name} ({plan.duration})</option>
                  ))}
                  {/* Fallback existing plans if not in SUBSCRIPTION_PLANS */}
                  {!SUBSCRIPTION_PLANS.find(p => p.id === editForm.subscriptionPlan) && (
                     <option value={editForm.subscriptionPlan}>{editForm.subscriptionPlan}</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tier Akun</label>
                <div className="grid grid-cols-2 gap-2">
                    <button 
                        type="button"
                        onClick={() => setEditForm({...editForm, tier: 'STANDARD'})}
                        className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl border-2 transition-all ${editForm.tier === 'STANDARD' ? 'border-sky-500 bg-sky-50 text-sky-600' : 'border-gray-100 text-gray-400'}`}
                    >Standard</button>
                    <button 
                        type="button"
                        onClick={() => setEditForm({...editForm, tier: 'PRO'})}
                        className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl border-2 transition-all ${editForm.tier === 'PRO' ? 'border-emerald-500 bg-emerald-50 text-emerald-600 shadow-lg shadow-emerald-500/10' : 'border-gray-100 text-gray-400'}`}
                    >Pro (Advanced)</button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 italic leading-tight">Tier Pro mengaktifkan statistik bisnis lanjutan di dashboard klien.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Masa Aktif (Hingga Tanggal)</label>
                <div className="flex gap-2">
                    <input 
                      type="date" 
                      value={editForm.validUntil} 
                      onChange={e => setEditForm({...editForm, validUntil: e.target.value})} 
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                        type="button"
                        onClick={() => {
                            let newDate = new Date();
                            if (editForm.subscriptionPlan === 'MONTHLY') newDate = addMonths(newDate, 1);
                            else if (editForm.subscriptionPlan === '2YEARS') newDate = addYears(newDate, 2);
                            else if (editForm.subscriptionPlan === 'LIFETIME') newDate = addYears(newDate, 100);
                            else newDate = addYears(newDate, 1); // Default for YEARLY

                            setEditForm({ ...editForm, validUntil: format(newDate, 'yyyy-MM-dd') });
                            toast.success(`Masa aktif diperbarui sesuai paket ${editForm.subscriptionPlan}`);
                        }}
                        className="px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold rounded-lg text-xs hover:bg-blue-100 transition-colors"
                    >
                        RESET DARI HARI INI
                    </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 italic leading-tight">Ubah paket di atas lalu klik "RESET DARI HARI INI" untuk otomatis memperbarui tanggal, atau atur secara manual.</p>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center mb-3">
                   <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">Fitur & Tier Preset</label>
                   <div className="flex gap-1">
                      <button 
                        onClick={() => setEditForm({...editForm, tier: 'STANDARD', enabledFeatures: { anc: false, kb: false, immunization: false, dental: false, lab: true, reports: true, eye: false, systemic_physic: false, medicines: true, lab_upload: false }})}
                        className="text-[8px] font-black bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-200 uppercase"
                      >Basic</button>
                      <button 
                        onClick={() => setEditForm({...editForm, tier: 'STANDARD', enabledFeatures: { anc: true, kb: true, immunization: true, dental: false, lab: true, reports: true, eye: false, systemic_physic: true, medicines: true, lab_upload: false }})}
                        className="text-[8px] font-black bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200 uppercase"
                      >Standard</button>
                      <button 
                        onClick={() => setEditForm({...editForm, tier: 'PRO', enabledFeatures: { anc: true, kb: true, immunization: true, dental: true, lab: true, reports: true, eye: true, systemic_physic: true, medicines: true, lab_upload: true }})}
                        className="text-[8px] font-black bg-emerald-100 text-emerald-600 px-2 py-1 rounded hover:bg-emerald-200 uppercase"
                      >Pro</button>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-6">
                    {[
                      { id: 'anc', label: 'ANC (Kehamilan)' },
                      { id: 'kb', label: 'KB' },
                      { id: 'immunization', label: 'Imunisasi' },
                      { id: 'dental', label: 'Poli Gigi' },
                      { id: 'lab', label: 'Laboratorium' },
                      { id: 'reports', label: 'Laporan' },
                      { id: 'medicines', label: 'Manajemen Obat' },
                      { id: 'eye', label: 'Poli Mata' },
                      { id: 'systemic_physic', label: 'Sistemik Fisik' },
                      { id: 'lab_upload', label: 'Upload Hasil Lab' },
                    ].map((feature) => (
                        <label key={feature.id} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors border-2 ${ (editForm.enabledFeatures as any)[feature.id] ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'bg-gray-50 dark:bg-gray-800 border-transparent'}`}>
                            <input 
                                type="checkbox"
                                checked={(editForm.enabledFeatures as any)[feature.id]}
                                onChange={(e) => setEditForm({
                                    ...editForm,
                                    enabledFeatures: { ...editForm.enabledFeatures, [feature.id]: e.target.checked }
                                })}
                                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                            />
                            <span className={`text-[10px] font-black uppercase tracking-widest ${ (editForm.enabledFeatures as any)[feature.id] ? 'text-primary-700 dark:text-primary-300' : 'text-gray-500'}`}>{feature.label}</span>
                        </label>
                    ))}
                </div>

                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Batasan Kapasitas (Quota)</label>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Max Pasien (0=Unlimit)</label>
                      <input 
                        type="number" 
                        value={editForm.maxPatients} 
                        onChange={e => setEditForm({...editForm, maxPatients: parseInt(e.target.value)})} 
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl text-xs font-bold"
                      />
                   </div>
                   <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Max User Staff (0=Unlimit)</label>
                      <input 
                        type="number" 
                        value={editForm.maxUsers} 
                        onChange={e => setEditForm({...editForm, maxUsers: parseInt(e.target.value)})} 
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl text-xs font-bold"
                      />
                   </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleUpdateClinic}
                disabled={!editForm.name || !editForm.email}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Stats Modal */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white dark:bg-dark-surface rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 border border-gray-100 dark:border-dark-border">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-dark-surface">
              <div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Statistik Aktivitas</h3>
                  <p className="text-xs font-bold text-gray-400 mt-1">{activityClinicName}</p>
              </div>
              <button onClick={() => setIsActivityModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-gray-100 dark:bg-gray-800 p-2 rounded-full transition-colors">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
                {activityLoading ? (
                    <div className="py-12 flex justify-center items-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-200 border-t-primary-600"></div>
                    </div>
                ) : activityStats ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Total Pasien</p>
                                <p className="text-3xl font-black text-gray-900 dark:text-white">{activityStats.totalPatients}</p>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-100 dark:border-green-900/30">
                                <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-widest mb-1">Total Rekam Medis</p>
                                <p className="text-3xl font-black text-gray-900 dark:text-white">{activityStats.totalExaminations}</p>
                            </div>
                            <div className="col-span-2 bg-purple-50 dark:bg-purple-900/20 p-4 rounded-2xl border border-purple-100 dark:border-purple-900/30">
                                <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1">Total Obat (Inventaris)</p>
                                <p className="text-3xl font-black text-gray-900 dark:text-white">{activityStats.totalMedicines}</p>
                            </div>
                        </div>
                        
                        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-2 text-gray-400">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Terakhir Login: <strong className="ml-2 text-gray-900 dark:text-white">
                                    {activityStats.lastLoginAt ? formatToWIB(activityStats.lastLoginAt) : 'Belum pernah login'}
                                </strong>
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-500">Data tidak tersedia.</div>
                )}
            </div>
            
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/30 flex justify-end">
              <button 
                onClick={() => setIsActivityModalOpen(false)}
                className="px-6 py-2.5 text-sm font-bold text-gray-700 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-xl transition-all shadow-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Area sensitif */}
      <div className="mt-12 bg-red-50 dark:bg-red-900/10 border-2 border-red-200 dark:border-red-900/30 rounded-3xl p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
                <h3 className="text-xl font-black text-red-600 dark:text-red-500 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Area Sensitif
                </h3>
                <p className="text-sm text-red-800 dark:text-red-300 mt-2 max-w-2xl font-medium">Aksi ini akan MENGHAPUS SEMUA DATA transaksi (pasien, obat, rekam medis) dan semua akun klinik kecuali akun Administrator. Gunakan hanya jika Anda ingin mengosongkan aplikasi secara total untuk reset produksi.</p>
            </div>
            <button
                onClick={() => setIsResetModalOpen(true)}
                className="shrink-0 bg-red-600 hover:bg-red-700 text-white font-black px-6 py-3 rounded-2xl shadow-lg shadow-red-500/30 transition-all transform hover:scale-105"
            >
                Kosongkan Database
            </button>
        </div>
      </div>

      {/* Modal reset database */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-red-900/40 backdrop-blur-md transition-all duration-300">
          <div className="bg-white dark:bg-dark-surface rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all border-2 border-red-100 dark:border-red-900">
            <div className="p-8 text-center">
                <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/40 mb-6">
                  <svg className="h-10 w-10 text-red-600 dark:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">Peringatan Keras!</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-6">
                    Anda akan menghapus seluruh data pada server ini secara permanen. Aksi ini tidak dapat dibatalkan.
                </p>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-left">Ketik <strong className="text-red-600 dark:text-red-400">RESET</strong> untuk mengonfirmasi:</p>
                    <input 
                      type="text" 
                      value={resetConfirmation}
                      onChange={(e) => setResetConfirmation(e.target.value)}
                      placeholder="RESET"
                      className="w-full text-center text-xl tracking-widest font-black px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl dark:bg-gray-900 dark:text-white focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all uppercase"
                    />
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  <button 
                    onClick={() => { setIsResetModalOpen(false); setResetConfirmation(''); }}
                    disabled={isResetting}
                    className="w-full px-6 py-3.5 text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-surface border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleResetDatabase}
                    disabled={resetConfirmation !== 'RESET' || isResetting}
                    className="w-full px-6 py-3.5 text-sm font-black text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:hover:scale-100 rounded-xl shadow-lg transition-all transform hover:scale-105 flex justify-center items-center"
                  >
                    {isResetting ? (
                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        "HANCURKAN DATA"
                    )}
                  </button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
