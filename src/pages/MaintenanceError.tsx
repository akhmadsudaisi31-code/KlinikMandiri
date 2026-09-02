import { useEffect, useState } from 'react';

export default function MaintenanceError() {
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          sessionStorage.removeItem('d1_limit_active');
          window.location.href = '/login';
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleRetry = () => {
    sessionStorage.removeItem('d1_limit_active');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 select-none">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-primary-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-lg w-full bg-slate-800/80 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-8 md:p-10 shadow-2xl text-center space-y-6 animate-fade-in-up">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 mb-2 shadow-inner">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>

        {/* Title & Badge */}
        <div className="space-y-2">
          <div className="inline-block px-3 py-1 bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-bold rounded-full uppercase tracking-wider">
            Pemeliharaan Sistem
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Layanan Sedang Mengalami Gangguan
          </h1>
        </div>

        {/* Description */}
        <p className="text-sm md:text-base text-slate-300 leading-relaxed">
          Mohon maaf atas ketidaknyamanannya. Saat ini aplikasi sedang dalam proses pemeliharaan rutin atau mengalami gangguan teknis sementara. Tim kami sedang berupaya memulihkan layanan secepat mungkin.
        </p>

        {/* Informational Callout */}
        <div className="bg-slate-900/60 border border-slate-700/80 rounded-2xl p-4 text-xs text-slate-400 text-left space-y-2">
          <div className="flex items-center gap-2 text-slate-200 font-semibold">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Data Anda Tetap Aman
          </div>
          <p>
            Seluruh data pasien, rekam medis, dan transaksi klinik Anda tetap tersimpan dengan aman di server cloud.
          </p>
        </div>

        {/* Actions */}
        <div className="pt-2 space-y-3">
          <button
            onClick={handleRetry}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-sky-500 to-primary-600 hover:from-sky-600 hover:to-primary-700 text-white font-bold rounded-2xl shadow-lg shadow-sky-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Coba Muat Ulang Halaman
          </button>
          
          <div className="text-xs text-slate-400">
            Mencoba otomatis dalam <span className="font-bold text-sky-400">{countdown}</span> detik
          </div>
        </div>
      </div>
    </div>
  );
}
