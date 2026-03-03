import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  status: 'pending' | 'active' | 'inactive';
  isAdmin: number;
  subscriptionPlan?: string;
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
            subscriptionPlan: data.subscriptionPlan
        };
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
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

  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
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
