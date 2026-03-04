import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import SubscriptionExpired from './pages/SubscriptionExpired';
import { differenceInDays } from 'date-fns';

// Props untuk AuthProvider (App)
interface AppProps {
  children: React.ReactNode;
}

/**
 * Komponen App utama sebagai AuthProvider.
 * Menyediakan data user (staf) ke seluruh aplikasi.
 */
function App({ children }: AppProps) {
  const { user, loading } = useAuth();

  // Tampilkan loading screen sederhana selagi cek auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-primary text-xl">Memuat...</div>
      </div>
    );
  }

  // Cek masa aktif langganan
  let daysRemaining: number | null = null;
  if (user && user.isAdmin !== 1 && user.validUntil) {
    daysRemaining = differenceInDays(new Date(user.validUntil), new Date());
    // Blokir hanya jika expired DAN tidak sedang dalam proses perpanjangan (pending)
    if (daysRemaining < 0 && user.status !== 'pending') {
       return <SubscriptionExpired />;
    }
  }

  // Format notifikasi banner
  const getBannerConfig = (days: number) => {
    if (days === 0) return { bg: 'bg-red-600', text: 'Hari ini adalah hari terakhir masa aktif langganan Anda!' };
    if (days <= 3) return { bg: 'bg-red-500', text: `Masa aktif langganan tersisa ${days} hari lagi!` };
    if (days <= 7) return { bg: 'bg-orange-500', text: `Masa aktif langganan tersisa ${days} hari (1 minggu).` };
    if (days <= 14) return { bg: 'bg-yellow-500', text: `Masa aktif langganan tersisa ${days} hari (2 minggu).` };
    return { bg: 'bg-blue-500', text: `Masa aktif langganan tersisa ${days} hari (1 bulan).` };
  };

  const showBanner = daysRemaining !== null && daysRemaining <= 30;
  const bannerConfig = showBanner ? getBannerConfig(daysRemaining as number) : null;

  return (
    <>
      {/* Expiration Banner */}
      {showBanner && bannerConfig && (
         <div className={`fixed top-0 left-0 right-0 z-[60] px-4 py-2 ${bannerConfig.bg} text-white text-xs md:text-sm font-bold text-center flex items-center justify-center gap-2 shadow-md`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 md:w-5 md:h-5 animate-pulse">
              <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
            </svg>
            <span>{bannerConfig.text} Hubungi Admin untuk perpanjang paket.</span>
         </div>
      )}

      {/* Tampilkan Header jika user sudah login */}
      {user && <Header />}
      <main className={`p-4 md:p-8 ${showBanner ? 'pt-32 md:pt-36' : 'pt-24 md:pt-28'} w-full mx-auto pb-4 md:pb-6 min-h-screen flex flex-col justify-between transition-all`}>
        {children}
        {user && (
          <footer className="mt-12 text-center text-sm text-gray-400 dark:text-gray-600 pb-4">
            &copy; {new Date().getFullYear()} AKHMAD SUDAISI. All rights reserved.
          </footer>
        )}
      </main>
      {user && <BottomNav />}
    </>
  );
}

export default App;