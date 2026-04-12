import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

const DEMO_CATEGORIES = [
  {
    title: "Demo Bidan",
    description: "Masuk sebagai Bidan untuk mencoba alur ANC (Antenatal Care), KB, dan manajemen persalinan.",
    accent: "from-pink-500 to-rose-500",
    email: "demo.bidan@klinikmandiri.app",
    password: "demo12345",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    )
  },
  {
    title: "Demo Perawat",
    description: "Masuk sebagai Perawat untuk mengelola antrean, pemeriksaan fisik awal, dan data vital pasien.",
    accent: "from-blue-500 to-indigo-600",
    email: "demo.perawat@klinikmandiri.app",
    password: "demo12345",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0018 4.5h-2.25a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 0015.75 18.75zm-3.15-10.35h.008v.008h-.008V8.4zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
      </svg>
    )
  },
  {
    title: "Demo Dokter",
    description: "Masuk sebagai Dokter untuk mencoba alur SOAP lengkap, ICD-10, resep obat, dan riwayat klinis.",
    accent: "from-cyan-500 to-blue-600",
    email: "demo.dokter@klinikmandiri.app",
    password: "demo12345",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
      </svg>
    )
  },
  {
    title: "Demo Dokter Gigi",
    description: "Masuk sebagai Dokter Gigi untuk mencoba Odontogram interaktif dan diagnosa khusus dental.",
    accent: "from-purple-500 to-indigo-600",
    email: "demo.drg@klinikmandiri.app",
    password: "demo12345",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.67 2.67 0 0021 17.25l-5.83-5.83m-3.75 3.75L4.5 15.17a2.67 2.67 0 01-3.75-3.75l9-9a2.67 2.67 0 013.75 3.75l-1.67 1.67m3.75 3.75l1.67-1.67m-3.75 3.75l3.75-3.75" />
      </svg>
    )
  },
  {
    title: "Demo Terapis Gigi",
    description: "Masuk sebagai Terapis Gigi (TGM) untuk mencoba pelayanan promotif, preventif, dan karang gigi.",
    accent: "from-teal-500 to-emerald-600",
    email: "demo.tgm@klinikmandiri.app",
    password: "demo12345",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6.223a.75.75 0 00-.384.824 11.958 11.958 0 0010.404 10.404.75.75 0 00.824-.384 11.96 11.96 0 011.002-3.483m-13.626-6.13c.094.06.188.117.283.174" />
      </svg>
    )
  },
] as const;

function DemoCatalog() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleDemoLogin = async (email: string, password: string, title: string) => {
    const toastId = toast.loading(`Sedang menyiapkan ${title}...`);
    try {
      const res = await api.post("/auth/login", { email, password });
      login(res.token, res.user);
      toast.success(`Selamat datang di ${title}!`, { id: toastId });
      navigate("/");
    } catch (error: any) {
      toast.error(error?.message || `Gagal masuk ke ${title}. Pastikan akun demo sudah aktif.`, { id: toastId });
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] dark:bg-dark-bg selection:bg-primary-500/30 transition-colors duration-500 font-sans antialiased">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary-200/20 dark:bg-primary-900/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-200/20 dark:bg-cyan-900/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-12 md:py-20 lg:py-24 space-y-12 md:space-y-16">
        {/* Modern Hero Section */}
        <header className="text-center space-y-6 md:space-y-8 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/80 dark:bg-dark-surface/80 backdrop-blur-xl shadow-lg shadow-gray-200/50 dark:shadow-none border border-white dark:border-dark-border animate-fade-in">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-600 dark:text-cyan-400">
              KlinikMandiri Playground
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white tracking-tight leading-[1.05]">
            Mulai Pengalaman <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary-600 via-primary-500 to-cyan-500">Digital</span> Klinik Anda
          </h1>
          
          <p className="text-lg md:text-xl text-gray-500 dark:text-dark-muted leading-relaxed max-w-2xl mx-auto font-medium">
            Tidak perlu pendaftaran untuk sekadar mencoba. Pilih peran Anda dan lihat betapa mudahnya mengelola klinik.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Link
              to="/login"
              className="w-full sm:w-auto px-10 py-5 bg-white dark:bg-dark-surface text-gray-800 dark:text-gray-200 font-black rounded-3xl shadow-soft hover:shadow-xl hover:-translate-y-1 transition-all uppercase tracking-[0.2em] text-[11px] border border-gray-100 dark:border-dark-border"
            >
              Halaman Login
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto px-10 py-5 bg-primary-600 text-white font-black rounded-3xl shadow-glow hover:bg-primary-700 hover:scale-[1.05] hover:shadow-primary-500/40 transition-all uppercase tracking-[0.2em] text-[11px]"
            >
              Daftar Sekarang
            </Link>
          </div>
        </header>

        {/* Improved Demo Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {DEMO_CATEGORIES.map((item, index) => (
            <div
              key={item.email}
              className={`group relative bg-white/70 dark:bg-dark-surface/70 backdrop-blur-2xl rounded-[3rem] p-10 border border-white dark:border-dark-border shadow-soft hover:shadow-3xl hover:-translate-y-3 transition-all duration-700 flex flex-col h-full overflow-hidden ${
                index === 4 ? 'lg:col-start-2' : ''
              }`}
            >
              {/* Card Aura */}
              <div className={`absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br ${item.accent} opacity-[0.05] dark:opacity-[0.1] rounded-full blur-[60px] group-hover:opacity-[0.15] transition-opacity duration-700`} />
              
              <div className={`relative w-20 h-20 rounded-[1.75rem] bg-gradient-to-br ${item.accent} shadow-2xl mb-10 flex items-center justify-center text-white transform group-hover:scale-110 group-hover:rotate-[15deg] transition-all duration-700`}>
                {item.icon}
              </div>

              <div className="relative space-y-4 flex-grow">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {item.title}
                </h2>
                
                <p className="text-gray-500 dark:text-dark-muted text-base leading-relaxed font-medium">
                  {item.description}
                </p>
              </div>

              <div className="relative mt-12 space-y-6">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-dark-muted">Status Demo</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500">Live</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDemoLogin(item.email, item.password, item.title)}
                  className={`relative w-full py-5 rounded-2xl bg-gradient-to-r ${item.accent} text-white font-black text-xs uppercase tracking-[0.25em] shadow-xl hover:shadow-2xl hover:brightness-110 active:scale-95 transition-all overflow-hidden group/btn flex items-center justify-center gap-4`}
                >
                  <span className="relative z-10">Eksplorasi Sekarang</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="relative z-10 h-5 w-5 transform group-hover/btn:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  
                  {/* Button Shine Effect */}
                  <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover/btn:left-[100%] transition-all duration-1000" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Elegant Footer */}
        <footer className="text-center md:flex md:items-center md:justify-between pt-16 border-t border-gray-100 dark:border-dark-border/50">
          <p className="text-xs font-bold text-gray-400 dark:text-dark-muted uppercase tracking-[0.2em]">
            &copy; {new Date().getFullYear()} KlinikMandiri &bull; Built for healthcare providers
          </p>
          <div className="mt-4 md:mt-0 flex items-center justify-center gap-6">
            <span className="text-[10px] font-black text-gray-300 dark:text-dark-muted uppercase tracking-widest">v2.0.4-PRO</span>
            <div className="h-4 w-px bg-gray-100 dark:bg-dark-border" />
            <a href="#" className="text-[10px] font-black text-primary-500 hover:text-primary-600 uppercase tracking-widest">Bantuan & Dukungan</a>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default DemoCatalog;
