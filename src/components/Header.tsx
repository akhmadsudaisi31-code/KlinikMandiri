import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useAuth } from '../App';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext'; // Import tema

import { db } from '../firebaseConfig';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Notification } from '../types';
import { startNotificationLoop, stopNotificationLoop } from '../utils/audio';

function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  
  // Ref untuk melacak apakah ini snapshot pertama (data awal)
  const isFirstRun = React.useRef(true);

  // Listener Notifikasi Realtime
  React.useEffect(() => {
    if (!user) return;
    
    // Reset isFirstRun saat listener di-init ulang (misal user ganti)
    isFirstRun.current = true;

    // Query 10 notifikasi terakhir (tanpa filter waktu lokal untuk hindari masalah jam device)
    const q = query(
      collection(db, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Abaikan snapshot pertama (history) agar tidak muncul notif saat refresh
      if (isFirstRun.current) {
        isFirstRun.current = false;
        return;
      }
      
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const notif = change.doc.data() as Notification;
          
          // Tampilkan notifikasi menggunakan Toast
          // Kita bisa memfilter berdasarkan Role jika ada sistem role
          // Saat ini tampilkan ke semua, tapi bedakan icon/bunyi
          
          // Play sound for relevant notifications
          if (notif.type === 'CALL_PATIENT') {
              startNotificationLoop('calling');
          } else if (notif.type === 'NEW_PATIENT') {
              startNotificationLoop('incoming');
          }

          if (notif.type === 'CALL_PATIENT') {
             toast(
               (t) => (
                 <div className="flex flex-col items-center w-[calc(100vw-32px)] sm:w-96 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 animate-bounce-in">
                    {/* Icon with Pulse */}
                    <div className="relative mb-4">
                        <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-20 duration-1000"></div>
                        <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-full text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-50 dark:ring-blue-900/20">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                          </svg>
                        </div>
                    </div>
                    
                    {/* Content */}
                    <div className="text-center mb-6 w-full">
                      <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">Panggilan Pasien</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed px-1 font-medium">{notif.message}</p>
                    </div>

                    {/* Button */}
                    <button 
                        onClick={() => {
                            stopNotificationLoop();
                            toast.dismiss(t.id);
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-blue-200 dark:shadow-none"
                    >
                        OK, SAYA MENGERTI
                    </button>
                 </div>
               ),
               { 
                   duration: Infinity, 
               }
             );
          } else if (notif.type === 'NEW_PATIENT') {
             toast(
               (t) => (
                 <div className="flex flex-col items-center w-[calc(100vw-32px)] sm:w-96 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 animate-bounce-in">
                    {/* Icon with Pulse */}
                    <div className="relative mb-4">
                        <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20 duration-1000"></div>
                        <div className="relative bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-full text-white shadow-lg shadow-green-500/30 ring-4 ring-green-50 dark:ring-green-900/20">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="text-center mb-6 w-full">
                      <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">Pasien Baru</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed px-1 font-medium">{notif.message}</p>
                    </div>

                    {/* Button */}
                    <button 
                        onClick={() => {
                            stopNotificationLoop();
                            toast.dismiss(t.id);
                        }}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 px-4 rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-green-200 dark:shadow-none"
                    >
                        TERIMA
                    </button>
                 </div>
               ),
               { 
                   duration: Infinity, 
                }
             );
          }
        }
      });
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logout berhasil.');
      navigate('/login');
    } catch (error) {
      console.error('Error logging out: ', error);
      toast.error('Gagal logout.');
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path
      ? "text-primary-700 bg-primary-50 font-semibold dark:bg-primary-900/30 dark:text-primary-400"
      : "text-gray-600 hover:text-primary-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-primary-400 transition-colors";
  };

  return (
    <header className="fixed w-full top-0 z-50 transition-all duration-300 px-4 pt-3">
      <nav className="glass w-full mx-auto px-4 sm:px-6 lg:px-8 rounded-2xl shadow-sm">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            {/* Logo Area */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-gradient-to-br from-primary-500 to-primary-600 text-white p-2 rounded-xl shadow-glow group-hover:shadow-lg group-hover:shadow-primary-500/40 transition-all transform group-hover:scale-105 duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-800 dark:text-white tracking-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors font-sans">
                RM <span className="text-primary-600 dark:text-primary-500">SatSet</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            {user && (
              <div className="hidden md:flex gap-2 text-sm font-medium">
                <Link to="/" className={`px-4 py-2 rounded-lg transition-all ${isActive('/')}`}>
                  Dashboard
                </Link>
                <Link to="/pendaftaran" className={`px-4 py-2 rounded-lg transition-all ${isActive('/pendaftaran')}`}>
                  Pendaftaran
                </Link>
                <Link to="/pemeriksaan" className={`px-4 py-2 rounded-lg transition-all ${isActive('/pemeriksaan')}`}>
                  Pemeriksaan
                </Link>
                <Link to="/obat" className={`px-4 py-2 rounded-lg transition-all ${isActive('/obat')}`}>
                  Obat
                </Link>
                <Link to="/laporan" className={`px-4 py-2 rounded-lg transition-all ${isActive('/laporan')}`}>
                  Laporan
                </Link>
              </div>
            )}
          </div>

          {user && (
            <div className="flex items-center gap-4">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
              >
                {theme === 'dark' ? (
                  /* Sun Icon */
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-yellow-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                  </svg>
                ) : (
                  /* Moon Icon */
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                  </svg>
                )}
              </button>

              {/* User Info (Desktop) */}
              <div className="hidden md:flex flex-col items-end">
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Operator</span>
                <span className="text-sm text-gray-700 dark:text-gray-200 font-medium leading-none">
                  {user.email?.split('@')[0]}
                </span>
              </div>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  )}
                </svg>
              </button>

              <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 hidden md:block"></div>

              {/* Logout Button (Desktop) */}
              <button
                onClick={handleLogout}
                className="hidden md:block text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Keluar Aplikasi"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {user && isMobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-20 mx-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-100 dark:border-gray-800 shadow-2xl rounded-2xl animate-fade-in-down z-[60]">
          <div className="px-4 pt-2 pb-4 space-y-1">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              Dashboard
            </Link>
            <Link
              to="/pendaftaran"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/pendaftaran' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              Pendaftaran
            </Link>
            <Link
              to="/pemeriksaan"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/pemeriksaan' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              Pemeriksaan
            </Link>
            <Link
              to="/obat"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/obat' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              Obat
            </Link>
            <Link
              to="/laporan"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/laporan' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              Laporan
            </Link>
            <div className="border-t border-gray-100 dark:border-gray-800 my-2 pt-2">
              <div className="px-3 py-2">
                <span className="block text-xs text-gray-500 dark:text-gray-500 font-bold uppercase">Login sebagai</span>
                <span className="block text-sm font-medium text-gray-900 dark:text-white">{user.email}</span>
              </div>
              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Keluar Aplikasi
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;