import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useAuth } from '../App';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext'; // Import tema

function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme(); // Hook tema

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
    <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 transition-colors duration-300">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            {/* Logo Area */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-gradient-to-br from-primary-500 to-primary-700 text-white p-2 rounded-xl shadow-lg shadow-primary-200 dark:shadow-none group-hover:shadow-primary-300 transition-all transform group-hover:scale-105">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-800 dark:text-white tracking-tight group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">
                RM <span className="text-primary-600 dark:text-primary-500">SatSet</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            {user && (
              <div className="hidden md:flex gap-2 text-sm font-medium">
                <Link to="/" className={`px-4 py-2 rounded-lg transition-all ${isActive('/')}`}>
                  Dashboard
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
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-lg animate-fade-in-down">
          <div className="px-4 pt-2 pb-4 space-y-1">
            <Link 
              to="/" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              Dashboard
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