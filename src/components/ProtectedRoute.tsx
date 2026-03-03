import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
    return (
      <div className="flex items-center justify-center min-h-screen">
        Memeriksa autentikasi...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to activation pending if user is not active and not an admin
  if (user.status === 'pending' && user.isAdmin !== 1 && location.pathname !== '/activation-pending') {
      return <Navigate to="/activation-pending" replace />;
  }

  // If user is already active or is admin, or already on activation pending
  return <>{children}</>;
}

export default ProtectedRoute;