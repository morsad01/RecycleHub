import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { usePermissions } from '../hooks/usePermissions';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export function SuperAdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { isSuperAdmin, loading: rbacLoading } = usePermissions();
  const location = useLocation();

  if (loading || rbacLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/superadmin" state={{ from: location }} replace />;
  if (!isSuperAdmin) return <Navigate to="/403" replace />;
  
  return <>{children}</>;
}
