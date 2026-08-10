import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { AppPermission } from '../types/rbac.types';

export function usePermissions() {
  const { user, profile } = useAuth();
  const [permissions, setPermissions] = useState<AppPermission[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRBAC() {
      if (!user) {
        setPermissions([]);
        setRoles([]);
        setLoading(false);
        return;
      }

      try {
        // Fetch roles
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('app_roles(name)')
          .eq('user_id', user.id);
          
        const userRoles = roleData?.map((r: any) => r.app_roles?.name || r.app_roles?.[0]?.name) || [];
        if (profile?.role === 'super_admin' && !userRoles.includes('super_admin')) {
          userRoles.push('super_admin');
        }
        setRoles(userRoles);

        if (userRoles.length > 0 || profile?.role === 'super_admin') {
            const roleIds = (roleData ?? []).map((r: any) => r.app_roles?.id || null).filter(Boolean);
            let userPerms: AppPermission[] = [];

            if (roleIds.length > 0) {
              const { data: permData } = await supabase
                  .from('role_permissions')
                  .select('app_permissions(name)')
                  .in('role_id', roleIds);
              
              userPerms = permData?.map((p: any) => (p.app_permissions?.name || p.app_permissions?.[0]?.name) as AppPermission) || [];
            }
            
            if (userRoles.includes('super_admin') || profile?.role === 'super_admin') {
                setPermissions(Object.values(AppPermission));
            } else {
                setPermissions(userPerms);
            }
        }
      } catch (err) {
        console.error('Failed to fetch RBAC data', err);
      } finally {
        setLoading(false);
      }
    }

    fetchRBAC();
  }, [user, profile]);

  const hasPermission = (permission: AppPermission) => {
    return permissions.includes(permission) || roles.includes('super_admin') || profile?.role === 'super_admin';
  };

  const isSuperAdmin = roles.includes('super_admin') || profile?.role === 'super_admin';

  return { permissions, roles, loading, hasPermission, isSuperAdmin };
}
