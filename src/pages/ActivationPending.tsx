import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { SUBSCRIPTION_PLANS, getPlanPrice, TierId } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import { generateDynamicQRIS } from '../utils/qris';

const BASE_QRIS = "00020101021126610014COM.GO-JEK.WWW01189360091439089487840210G9089487840303UMI51440014ID.CO.QRIS.WWW0215ID10264904303490303UMI5204762353033605802ID5920Arzachel Maintenance6009BANGKALAN61056917462070703A016304A9CF";

function ActivationPending() {
  const { user, refreshUser, logout } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (user.status === 'active') return <Navigate to="/" replace />;

  const plan = SUBSCRIPTION_PLANS.find(p => p.id === user.subscriptionPlan) || SUBSCRIPTION_PLANS[0];
  const tierId = (user.tier as TierId) || 'STANDARD';
  const totalPrice = getPlanPrice(plan.id, tierId);

  const handleRefresh = async () => {
    await refreshUser();
    toast.success('Status diperbarui');
  };

  const [copiedRek, setCopiedRek] = useState(false);
  const handleCopyRek = () => {
    navigator.clipboard.writeText('610201032852508');
    setCopiedRek(true);
    toast.success('Nomor rekening disalin');
    setTimeout(() => setCopiedRek(false), 2000);
  };

  const [copiedPrice, setCopiedPrice] = useState(false);

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
                    <span className="text-gray-500 dark:text-gray-400 font-bold text-xs">Level Paket</span>
                    <span className={`font-black uppercase tracking-tight ${tierId === 'PRO' ? 'text-orange-500' : tierId === 'STANDARD' ? 'text-blue-500' : 'text-green-500'}`}>
                        {tierId}
                    </span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-dashed border-gray-200 dark:border-gray-700 pb-2 mb-2">
                    <span className="text-gray-500 dark:text-gray-400 font-bold text-xs">Durasi Plan</span>
                    <span className="text-primary-600 font-black uppercase tracking-tight">{plan.name}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400 font-bold text-xs">Total Tagihan</span>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-900 dark:text-white font-black text-lg underline decoration-2 underline-offset-4 decoration-primary-500/30">
                            Rp {totalPrice.toLocaleString('id-ID')}
                        </span>
                        <button onClick={() => {
                            navigator.clipboard.writeText(totalPrice.toString());
                            setCopiedPrice(true);
                            toast.success('Nominal disalin');
                            setTimeout(() => setCopiedPrice(false), 2000);
                        }} className="p-1 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition" title="Salin Nominal">
                            {copiedPrice ? (
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
                <div className="h-px bg-gray-200 dark:bg-gray-700 w-full my-2"></div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400 font-bold text-xs">Bank Transfer</span>
                    <span className="text-gray-900 dark:text-white font-black">Bank BRI</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400 font-bold text-xs font-mono">No. Rekening</span>
                    <div className="flex items-center gap-2">
                        <span className="text-primary-600 font-black tracking-widest underline decoration-2 underline-offset-4">610201032852508</span>
                        <button onClick={handleCopyRek} className="p-1 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition" title="Salin Rekening">
                            {copiedRek ? (
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

            <div className="mt-8 pt-6 border-t border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center">
                <p className="text-[10px] font-black text-primary-600 uppercase mb-4 tracking-widest text-center">Bayar via QRIS</p>
                <div className="relative group">
                    <div className="bg-white p-4 rounded-3xl shadow-sm border-4 border-primary-500/20 transition-transform hover:scale-105 duration-300 inline-block text-center">
                        <p className="text-[8px] font-black text-primary-600 uppercase mb-2">ARZACHEL MAINTENANCE</p>
                        <QRCodeSVG 
                          value={generateDynamicQRIS(BASE_QRIS, totalPrice)} 
                          size={200}
                          level="H"
                          includeMargin={true}
                        />
                        <div className="h-px bg-gray-100 w-full my-2"></div>
                        <p className="text-[10px] font-black text-gray-900">Rp {totalPrice.toLocaleString('id-ID')}</p>
                    </div>
                </div>

                <p className="text-[11px] text-gray-500 font-medium mt-6 text-center leading-relaxed">
                  Gunakan kode QR di atas atau transfer manual <br/>
                  <span className="font-black text-primary-600">Rp {totalPrice.toLocaleString('id-ID')}</span>
                </p>
                
                <div className="mt-3 bg-primary-50 dark:bg-primary-900/20 w-full p-4 rounded-xl border border-primary-100 dark:border-primary-900/30">
                    <p className="text-xs text-center leading-relaxed font-bold text-primary-700 dark:text-primary-300">
                        <span className="uppercase block mb-1">ℹ️ PENTING:</span>
                        Pastikan nominal transfer sesuai dengan tagihan agar proses aktivasi dapat berjalan lebih cepat.
                    </p>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-dashed border-gray-200 dark:border-gray-700">
                <p className="text-[9px] text-gray-400 dark:text-gray-500 leading-relaxed font-bold">Kirim bukti transfer ke WhatsApp admin di bawah untuk aktivasi instan:</p>
                <a 
                    href={`https://wa.me/6282333017615?text=Halo%20Admin%2C%20saya%20sudah%20transfer%20untuk%20aktivasi%20Klinik%20${encodeURIComponent(user.displayName || 'Baru')}%20(Tier%3A%20${tierId}%2C%20Plan%3A%20${encodeURIComponent(plan.name || '-')})`} 
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
