import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export function RoleRoute({ roles }) {
  const { hasAnyRole, loading } = useAuth();

  if (loading) return null; // Or a spinner

  if (!hasAnyRole(...roles)) {
    return <Navigate to="/" replace />; // Redirect to dashboard if not authorized
  }

  return <Outlet />;
}
