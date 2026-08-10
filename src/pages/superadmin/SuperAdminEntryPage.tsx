import { Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { SuperAdminLoginPage } from './SuperAdminLoginPage';
import { SuperAdminLayout } from './SuperAdminLayout';
import { PlatformHealthPage } from './PlatformHealthPage';

export function SuperAdminEntryPage() {
  const { user, loading } = useAuth();
  const { isSuperAdmin, loading: rbacLoading } = usePermissions();

  if (loading || rbacLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin h-8 w-8 rounded-full border-2 border-red-500 border-t-transparent" />
      </div>
    );
  }

  // If not logged in, render the login form directly
  if (!user) {
    return <SuperAdminLoginPage />;
  }

  // If logged in but not a Super Admin, redirect to the forbidden page
  if (!isSuperAdmin) {
    return <Navigate to="/403" replace />;
  }

  // Renders the default control center dashboard if Super Admin is authenticated
  return (
    <SuperAdminLayout>
      <PlatformHealthPage />
    </SuperAdminLayout>
  );
}
export default SuperAdminEntryPage;
