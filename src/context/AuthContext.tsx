import React, { createContext, useContext, useEffect, useState } from 'react';
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
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
    } catch (e) {
        console.error("Failed to refresh user", e);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        // Silently refresh in background
        refreshUser();
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Sync theme with user.clinicType
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
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    clearSentryUser();
    // Use deduplicated toast ID to prevent stacking
    toast.success("Logout berhasil.", { id: 'auth-status' });
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
