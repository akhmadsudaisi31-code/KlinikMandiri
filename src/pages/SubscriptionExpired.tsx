import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { SUBSCRIPTION_PLANS } from '../types';
import { api } from '../api';
import toast from 'react-hot-toast';

export default function SubscriptionExpired() {
  const { logout } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('MONTHLY');
  const [loading, setLoading] = useState(false);

  const handleRenew = async () => {
    try {
      setLoading(true);
      await api.put('/auth/renew', { subscriptionPlan: selectedPlan });
      toast.success('Permintaan perpanjangan dikirim. Mengalihkan ke halaman pembayaran...');
      setTimeout(() => {
          window.location.href = '/activation-pending';
      }, 1500);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Gagal mengajukan perpanjangan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-surface p-8 md:p-12 rounded-3xl shadow-2xl max-w-lg w-full text-center border-t-8 border-red-500 relative overflow-hidden">
        
        {/* Header Warning */}
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 mt-2">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">Masa Aktif Habis</h1>
        
        {!showForm ? (
            <>
                <p className="text-gray-500 dark:text-gray-400 mb-8 mx-auto leading-relaxed text-sm">
                  Langganan klinik Anda telah berakhir. Anda tidak dapat mengakses data rekam medis saat ini.
                  Silakan perpanjang langganan untuk menikmati kembali seluruh fitur aplikasi.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setShowForm(true)}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary-500/30 transition-all uppercase tracking-widest text-sm"
                  >
                    Perpanjang Langganan
                  </button>
                  <a
                    href="https://wa.me/6282333017615?text=Halo%20Admin,%20saya%20ingin%20meminta%20bantuan%20terkait%20masa%20aktif%20langganan%20SATSET%20RM"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-500/30 transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-2 mt-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    Hubungi Admin
                  </a>
                  <button
                    onClick={logout}
                    className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold py-3.5 rounded-xl transition-all uppercase tracking-widest text-xs mt-2"
                  >
                    Keluar (Logout)
                  </button>
                </div>
            </>
        ) : (
            <div className="text-left mt-6 animate-fade-in-up">
                <hr className="mb-6 border-gray-100 dark:border-gray-800" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-widest">Pilih Paket Perpanjangan</h3>
                <div className="space-y-3 mb-6">
                    {SUBSCRIPTION_PLANS.map(plan => (
                        <label 
                            key={plan.id} 
                            className={`flex flex-col p-4 border rounded-2xl cursor-pointer transition-all ${
                                selectedPlan === plan.id 
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500/20' 
                                : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <input 
                                    type="radio" 
                                    name="plan" 
                                    value={plan.id} 
                                    checked={selectedPlan === plan.id}
                                    onChange={(e) => setSelectedPlan(e.target.value)}
                                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                                />
                                <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                        <div className="font-bold text-gray-900 dark:text-white text-sm">{plan.name}</div>
                                        <div className="font-black text-primary-600 text-sm">Rp{plan.price.toLocaleString('id-ID')}</div>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{plan.duration}</div>
                                </div>
                            </div>
                        </label>
                    ))}
                </div>
                
                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold py-3.5 rounded-xl transition-all uppercase tracking-widest text-xs"
                  >
                    Kembali
                  </button>
                  <button
                    onClick={handleRenew}
                    disabled={loading}
                    className="flex-[2] bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary-500/30 transition-all uppercase tracking-widest text-sm"
                  >
                    {loading ? 'Memproses...' : 'Lanjutkan'}
                  </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
