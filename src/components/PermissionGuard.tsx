import { ReactNode } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { AppPermission } from '../types/rbac.types';

interface PermissionGuardProps {
  require: AppPermission | AppPermission[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({ require, children, fallback = null }: PermissionGuardProps) {
  const { hasPermission, loading, isSuperAdmin } = usePermissions();

  if (loading) return null;

  if (isSuperAdmin) {
    return <>{children}</>;
  }

  const requirements = Array.isArray(require) ? require : [require];
  const hasAccess = requirements.some(req => hasPermission(req));

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
