import React, {
  createContext,
  useContext,
  useEffect,
  useState
} from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebaseConfig';
import Header from './components/Header';
import BottomNav from './components/BottomNav';

// Tipe untuk AuthContext
interface AuthContextType {
  user: User | null;
  loading: boolean;
}

// Buat AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props untuk AuthProvider (App)
interface AppProps {
  children: React.ReactNode;
}

/**
 * Komponen App utama sebagai AuthProvider.
 * Menyediakan data user (staf) ke seluruh aplikasi.
 */
function App({ children }: AppProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listener untuk status autentikasi
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup listener saat unmount
    return () => unsubscribe();
  }, []);

  const value = { user, loading };

  // Tampilkan loading screen sederhana selagi cek auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-primary text-xl">Memuat...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
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
    </AuthContext.Provider>
  );
}

/**
 * Hook kustom untuk mengakses AuthContext.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth harus digunakan di dalam App (AuthProvider)');
  }
  return context;
};

export default App;