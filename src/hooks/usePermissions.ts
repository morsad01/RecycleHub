import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { AppPermission } from '../types/rbac.types';

export function usePermissions() {
  const { user } = useAuth();
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
        setRoles(userRoles);

        // Fetch permissions via RPC or complex join
        // For simplicity on frontend, we can fetch role_permissions if RLS allows, or rely on a dedicated RPC.
        // Assuming we have an RPC or we just fetch from role_permissions:
        if (userRoles.length > 0) {
            const { data: permData } = await supabase
                .from('role_permissions')
                .select('app_permissions(name)')
                .in('role_id', roleData!.map((r: any) => r.app_roles?.id || null).filter(Boolean));
            
            const userPerms = permData?.map((p: any) => (p.app_permissions?.name || p.app_permissions?.[0]?.name) as AppPermission) || [];
            
            // If super admin, inject all manually to be safe on frontend display (RLS still blocks on backend)
            if (userRoles.includes('super_admin')) {
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
  }, [user]);

  const hasPermission = (permission: AppPermission) => {
    return permissions.includes(permission) || roles.includes('super_admin');
  };

  const isSuperAdmin = roles.includes('super_admin');

  return { permissions, roles, loading, hasPermission, isSuperAdmin };
}
