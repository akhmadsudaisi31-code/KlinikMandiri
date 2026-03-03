import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { SUBSCRIPTION_PLANS } from '../types';

function ActivationPending() {
  const { user, refreshUser, logout } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (user.status === 'active') return <Navigate to="/" replace />;

  const plan = SUBSCRIPTION_PLANS.find(p => p.id === user.subscriptionPlan) || SUBSCRIPTION_PLANS[0];

  const handleRefresh = async () => {
    await refreshUser();
    toast.success('Status diperbarui');
  };

  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText('610201032852508');
    setCopied(true);
    toast.success('Nomor rekening disalin');
    setTimeout(() => setCopied(false), 2000);
  };



  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-card p-10 rounded-3xl shadow-2xl border border-primary-100 dark:border-dark-border text-center">
        <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10 text-primary-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </div>
        
        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-2">Menunggu Aktivasi</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-bold mb-8 italic">Halo {user.displayName}, akun Anda sedang dalam proses verifikasi.</p>

        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl text-left mb-8 border border-gray-100 dark:border-gray-700">
            <p className="text-[10px] font-black text-primary-600 uppercase mb-4 tracking-widest text-center">Informasi Pembayaran</p>
            <div className="space-y-4">
                <div className="flex justify-between items-center text-sm border-b border-dashed border-gray-200 dark:border-gray-700 pb-2 mb-2">
                    <span className="text-gray-500 dark:text-gray-400 font-bold text-xs">Plan Dipilih</span>
                    <span className="text-primary-600 font-black uppercase tracking-tight">{plan.name}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400 font-bold text-xs">Total Tagihan</span>
                    <span className="text-gray-900 dark:text-white font-black text-lg">Rp {plan.price.toLocaleString('id-ID')}</span>
                </div>
                <div className="h-px bg-gray-200 dark:bg-gray-700 w-full my-2"></div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400 font-bold text-xs">Bank Transfer</span>
                    <span className="text-gray-900 dark:text-white font-black">Bank BRI</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400 font-bold text-xs font-mono">No. Rekening</span>
                    <div className="flex items-center gap-2">
                        <span className="text-primary-600 font-black tracking-widest underline decoration-2 underline-offset-4">610201032852508</span>
                        <button onClick={handleCopy} className="p-1 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition" title="Salin Rekening">
                            {copied ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400 font-bold text-xs font-mono">Atas Nama</span>
                    <span className="text-gray-900 dark:text-white font-black uppercase tracking-tight">AKHMAD SUDAISI</span>
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center">
                <p className="text-[10px] font-black text-primary-600 uppercase mb-4 tracking-widest text-center">Bayar via QRIS</p>
                <div className="bg-white p-2 rounded-xl shadow-inner border border-gray-200" style={{ display: 'inline-block' }}>
                    <img src="/QRIS.jpeg" alt="QRIS Code" className="w-[150px] h-[150px] object-cover rounded-lg" />
                </div>
                <p className="text-[10px] text-gray-500 mt-3 text-center">Scan kode QR di atas menggunakan aplikasi M-Banking atau e-Wallet kesayangan Anda.</p>
                <p className="text-[10px] font-bold text-red-500 mt-1 text-center bg-red-50/50 p-2 rounded-lg border border-red-100">PENTING: Masukkan nominal <strong className="font-black text-red-600 text-xs">Rp {plan.price.toLocaleString('id-ID')}</strong> secara manual saat melakukan scan pembayaran.</p>
            </div>

            <div className="mt-6 pt-4 border-t border-dashed border-gray-200 dark:border-gray-700">
                <p className="text-[9px] text-gray-400 dark:text-gray-500 leading-relaxed font-bold">Kirim bukti transfer ke WhatsApp admin di bawah untuk aktivasi instan:</p>
                <a 
                    href={`https://wa.me/6282333017615?text=Halo%20Admin%2C%20saya%20sudah%20transfer%20untuk%20aktivasi%20Klinik%20${encodeURIComponent(user.displayName || 'Baru')}%20(Plan%3A%20${encodeURIComponent(plan.name || '-')})`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-2 block w-full bg-green-500 text-white text-center py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 transition-all"
                >
                    Chat Admin (WA)
                </a>
            </div>
        </div>

        <div className="space-y-3">
            <button 
                onClick={handleRefresh}
                className="w-full py-4 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 transition-all uppercase tracking-widest text-xs shadow-lg shadow-primary-500/20"
            >
                Cek Status Aktivasi
            </button>
            <button 
                onClick={logout}
                className="w-full py-3 bg-transparent text-gray-400 font-black rounded-2xl hover:text-red-500 transition-all uppercase tracking-widest text-[10px]"
            >
                Keluar / Logout
            </button>
        </div>
      </div>
    </div>
  );
}

export default ActivationPending;
