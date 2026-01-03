import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Komponen untuk melindungi route.
 * Hanya bisa diakses jika staf sudah login.
 */
function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Tampilkan loading jika status auth belum selesai dicek
    return (
      <div className="flex items-center justify-center min-h-screen">
        Memeriksa autentikasi...
      </div>
    );
  }

  if (!user) {
    // Jika user tidak login, redirect ke halaman login
    // Simpan lokasi asal agar bisa kembali setelah login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Jika user login, tampilkan children (halaman yang dituju)
  return <>{children}</>;
}

export default ProtectedRoute;