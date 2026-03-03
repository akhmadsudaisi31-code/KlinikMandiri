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
    status: 'pending' | 'active' | 'inactive';
    subscriptionPlan: string;
    createdAt: string;
}

function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [clinics, setClinics] = useState<ClinicEntry[]>([]);
  const [loading, setLoading] = useState(true);

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
    if (!window.confirm('Aktifkan klinik ini?')) return;
    try {
      await api.put(`/admin/clinics/${id}/activate`, {});
      toast.success('Klinik berhasil diaktifkan');
      fetchClinics();
    } catch (e) {
      toast.error('Gagal mengaktifkan klinik');
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
                            : 'bg-yellow-100 text-yellow-600'
                        }`}>
                            {clinic.status}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                        {clinic.status === 'pending' && (
                            <button
                                onClick={() => handleActivate(clinic.id)}
                                className="bg-primary-600 hover:bg-primary-700 text-white text-[10px] font-black px-4 py-2 rounded-xl transition-all shadow-lg shadow-primary-500/10 uppercase tracking-widest"
                            >
                                Activate
                            </button>
                        )}
                        {clinic.status === 'active' && (
                             <span className="text-green-500">
                                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 ml-auto">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                 </svg>
                             </span>
                        )}
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
    </div>
  );
}

export default AdminDashboard;
