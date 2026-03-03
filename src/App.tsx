import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import BottomNav from './components/BottomNav';

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

  return (
    <>
      {/* Tampilkan Header jika user sudah login */}
      {user && <Header />}
      <main className="p-4 md:p-8 pt-24 md:pt-28 w-full mx-auto pb-4 md:pb-6 min-h-screen flex flex-col justify-between">
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