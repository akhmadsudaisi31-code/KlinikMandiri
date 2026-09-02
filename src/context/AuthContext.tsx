import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { ClinicType } from '../types';
import { getClinicThemeClass } from '../utils/clinic';
import { setSentryUser, clearSentryUser } from '../utils/sentry';
import toast from 'react-hot-toast';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  status: 'pending' | 'active' | 'inactive';
  isAdmin: number;
  subscriptionPlan?: string;
  clinicType?: ClinicType;
  validUntil?: string;
  role?: string;
  subId?: string;
  features?: { [key: string]: boolean };
  maxPatients?: number;
  maxUsers?: number;
  tier?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Decode JWT payload tanpa verifikasi signature (client-side only).
 * Dipakai untuk cek waktu expire token sebelum hit backend.
 */
function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ?? null; // Unix timestamp detik
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Jadwalkan auto-refresh token 1 jam sebelum expire.
   * Memanggil /auth/me untuk mendapatkan token baru dari server.
   */
  const scheduleTokenRefresh = (token: string) => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    const exp = getTokenExpiry(token);
    if (!exp) return;

    const nowSec = Math.floor(Date.now() / 1000);
    const secondsUntilExpiry = exp - nowSec;

    // Refresh 1 jam sebelum expire (jika masih ada waktu lebih dari 1 jam)
    const refreshInSeconds = Math.max(secondsUntilExpiry - 3600, 60);

    refreshTimerRef.current = setTimeout(async () => {
      await silentRefreshToken();
    }, refreshInSeconds * 1000);
  };

  /**
   * Refresh token secara diam-diam (silent).
   * Minta token baru dari backend via /auth/refresh-token.
   * Jika gagal karena network error atau server error (bukan 401),
   * TIDAK logout — biarkan user tetap login dan coba lagi nanti.
   */
  const silentRefreshToken = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const json: any = await api.post('/auth/refresh-token', {});
      if (json?.token) {
        localStorage.setItem('token', json.token);
        scheduleTokenRefresh(json.token);
      }
    } catch {
      // Network error → diam saja, jangan logout
    }
  };

  /**
   * Refresh data user dari backend (/auth/me).
   * Jika gagal karena NETWORK error atau server error → JANGAN logout.
   * Hanya 401 yang legitimate (dari api.ts middleware) yang boleh logout.
   *
   * Catatan: api.ts sudah handle 401 otomatis (hapus token + redirect /login).
   * refreshUser hanya perlu tangkap error non-401 dengan tenang.
   */
  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Cek token sudah expire atau belum sebelum hit backend
    const exp = getTokenExpiry(token);
    if (exp && Math.floor(Date.now() / 1000) >= exp) {
      // Token sudah expire — jangan kirim request, langsung logout bersih
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      toast.error('Sesi login telah berakhir. Silakan login kembali.', { id: 'session-expired' });
      window.location.href = '/login';
      return;
    }

    try {
      const data: any = await api.get('/auth/me');
      const userData: User = {
        uid: data.id,
        email: data.email,
        displayName: data.name,
        status: data.status,
        isAdmin: data.isAdmin,
        subscriptionPlan: data.subscriptionPlan,
        clinicType: data.clinicType,
        validUntil: data.validUntil,
        role: data.role,
        subId: data.subId,
        tier: data.tier,
        features: data.features || {},
        maxPatients: data.maxPatients || 0,
        maxUsers: data.maxUsers || 0
      };
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setSentryUser({ uid: userData.uid, email: userData.email, name: userData.displayName || userData.email, clinicType: userData.clinicType });

      // Jadwalkan auto-refresh token setelah berhasil refresh user
      scheduleTokenRefresh(token);
    } catch (e: any) {
      // api.ts sudah handle 401 (logout + redirect). Error lain (network, D1 limit, dll)
      // → tangkap diam-diam, jangan logout, user masih pakai data dari localStorage
      if (e?.message !== 'Unauthorized') {
        console.warn('refreshUser: gagal ambil data terbaru, pakai data lokal.', e?.message);
      }
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        // Cek token expire sebelum set user
        const exp = getTokenExpiry(token);
        if (exp && Math.floor(Date.now() / 1000) >= exp) {
          // Token sudah expire saat app dibuka
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        } else {
          setUser(JSON.parse(storedUser));
          // Refresh data user di background (tidak blokir render)
          refreshUser();
          // Jadwalkan auto-refresh token
          scheduleTokenRefresh(token);
        }
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);

    // Cleanup timer saat unmount
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  // Sync theme dengan user.clinicType
  useEffect(() => {
    const themeClasses = ['theme-bidan', 'theme-perawat', 'theme-dokter', 'theme-dokter-gigi', 'theme-terapis-gigi'];
    document.body.classList.remove(...themeClasses);
    document.body.classList.add(getClinicThemeClass(user?.clinicType));
  }, [user]);

  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setSentryUser({ uid: userData.uid, email: userData.email, name: userData.displayName || userData.email, clinicType: userData.clinicType });
    // Jadwalkan auto-refresh token setelah login
    scheduleTokenRefresh(token);
  };

  const logout = () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    clearSentryUser();
    toast.success('Logout berhasil.', { id: 'auth-status' });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
