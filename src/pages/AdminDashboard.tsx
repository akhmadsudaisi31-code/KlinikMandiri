import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { SUBSCRIPTION_PLANS } from '../types';

interface ClinicEntry {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: 'pending' | 'active' | 'inactive' | 'rejected';
    subscriptionPlan: string;
    createdAt: string;
    lastLoginAt?: string;
}

function AdminDashboard() {
  const { user, loading: authLoading, login: userLogin } = useAuth();
  const [clinics, setClinics] = useState<ClinicEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClinic, setEditingClinic] = useState<ClinicEntry | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', subscriptionPlan: '' });

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

  useEffect(() => {
    if (user && user.isAdmin === 1) {
      fetchClinics();
    }
  }, [user]);

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

  const handleEditClick = (clinic: ClinicEntry) => {
    setEditingClinic(clinic);
    setEditForm({
      name: clinic.name,
      email: clinic.email,
      phone: clinic.phone || '',
      subscriptionPlan: clinic.subscriptionPlan || 'YEARLY'
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateClinic = async () => {
    if (!editingClinic) return;
    try {
      await api.put(`/admin/clinics/${editingClinic.id}`, editForm);
      toast.success('Data profil klinik berhasil diperbarui');
      setIsEditModalOpen(false);
      setEditingClinic(null);
      fetchClinics();
    } catch (e) {
      toast.error('Gagal memperbarui profil klinik');
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

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-8 rounded-3xl text-white shadow-2xl">
        <h1 className="text-3xl font-black uppercase tracking-tighter">System Admin <span className="text-primary-400">Panel</span></h1>
        <p className="text-gray-400 text-sm font-bold mt-1 uppercase tracking-widest">Konfirmasi & Aktivasi Klinik Baru</p>
      </div>

      <div className="bg-white dark:bg-dark-surface p-6 rounded-3xl shadow-soft dark:shadow-none border border-gray-100 dark:border-dark-border">
        {loading ? (
             <div className="text-center py-20 font-black text-gray-300 uppercase tracking-widest animate-pulse">Loading Data Klinik...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Klinik</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Kontak</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Paket</th>
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
                             {format(new Date(clinic.createdAt), 'dd MMM yyyy HH:mm', { locale: localeId })}
                         </p>
                    </td>
                    <td className="px-6 py-4">
                        <span className="text-[10px] font-black bg-primary-100 dark:bg-primary-900/30 text-primary-600 px-3 py-1 rounded-full uppercase tracking-widest">
                            {SUBSCRIPTION_PLANS.find(p => p.id === clinic.subscriptionPlan)?.name || clinic.subscriptionPlan}
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

                            {/* Preview Account Icon */}
                            <button
                                onClick={() => handleImpersonate(clinic.id, clinic.name)}
                                title="Preview Akun (Masuk ke Klinik)"
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
                                        Activate
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
                    </td>
                  </tr>
                ))}
                {clinics.length === 0 && (
                     <tr>
                         <td colSpan={5} className="text-center py-20 text-gray-300 font-black uppercase tracking-widest">Tidak Ada Klinik Terdaftar</td>
                     </tr>
                )}
              </tbody>
            </table>
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
                                    {activityStats.lastLoginAt ? format(new Date(activityStats.lastLoginAt), 'dd MMM yyyy HH:mm', { locale: localeId }) : 'Belum pernah login'}
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

      {/* Danger Zone: Reset Database */}
      <div className="mt-12 bg-red-50 dark:bg-red-900/10 border-2 border-red-200 dark:border-red-900/30 rounded-3xl p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
                <h3 className="text-xl font-black text-red-600 dark:text-red-500 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    DANGER ZONE
                </h3>
                <p className="text-sm text-red-800 dark:text-red-300 mt-2 max-w-2xl font-medium">Aksi ini akan MENGHAPUS SEMUA DATA transaksi (pasien, obat, rekam medis) dan semua akun klinik kecuali akun Administrator. Gunakan hanya jika Anda ingin mengosongkan aplikasi secara total untuk reset produksi.</p>
            </div>
            <button
                onClick={() => setIsResetModalOpen(true)}
                className="shrink-0 bg-red-600 hover:bg-red-700 text-white font-black px-6 py-3 rounded-2xl shadow-lg shadow-red-500/30 transition-all transform hover:scale-105"
            >
                Reset Database
            </button>
        </div>
      </div>

      {/* Reset Database Modal */}
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
