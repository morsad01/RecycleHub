import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { ShieldCheck, Shield, HelpCircle, Save } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
}

interface RolePermission {
  role_id: string;
  permission_id: string;
}

export function RoleManagementPage() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  async function fetchRBACMatrix() {
    try {
      setLoading(true);
      
      // 1. Fetch app_roles
      const { data: rolesData, error: rolesErr } = await supabase
        .from('app_roles')
        .select('*')
        .order('name');
      if (rolesErr) throw rolesErr;

      // 2. Fetch app_permissions
      const { data: permsData, error: permsErr } = await supabase
        .from('app_permissions')
        .select('*')
        .order('name');
      if (permsErr) throw permsErr;

      // 3. Fetch role_permissions relations
      const { data: rpData, error: rpErr } = await supabase
        .from('role_permissions')
        .select('*');
      if (rpErr) throw rpErr;

      setRoles(rolesData || []);
      setPermissions(permsData || []);
      setRolePermissions(rpData || []);
    } catch (err: any) {
      toast('Failed to load RBAC Matrix: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRBACMatrix();
  }, []);

  const handleTogglePermission = async (role: Role, perm: Permission, isCurrentlyAssigned: boolean) => {
    // Safety check: Prevent changing super_admin role permissions directly to prevent lockout
    if (role.name === 'super_admin') {
      toast('Super Admin permissions are protected and cannot be revoked.', 'warning');
      return;
    }

    const cellId = `${role.id}-${perm.id}`;
    setProcessing(cellId);

    try {
      if (isCurrentlyAssigned) {
        // Delete relation
        const { error } = await supabase
          .from('role_permissions')
          .delete()
          .eq('role_id', role.id)
          .eq('permission_id', perm.id);
        
        if (error) throw error;
        
        setRolePermissions(prev => prev.filter(rp => !(rp.role_id === role.id && rp.permission_id === perm.id)));
        toast(`Revoked ${perm.name} from ${role.name}`, 'info');
      } else {
        // Create relation
        const { error } = await supabase
          .from('role_permissions')
          .insert({ role_id: role.id, permission_id: perm.id });
          
        if (error) throw error;
        
        setRolePermissions(prev => [...prev, { role_id: role.id, permission_id: perm.id }]);
        toast(`Granted ${perm.name} to ${role.name}`, 'success');
      }
    } catch (err: any) {
      toast('Failed to update role mapping: ' + err.message, 'error');
    } finally {
      setProcessing(null);
    }
  };

  const isAssigned = (roleId: string, permId: string) => {
    return rolePermissions.some(rp => rp.role_id === roleId && rp.permission_id === permId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex justify-between items-center border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="text-red-500" size={20} /> RBAC Role-Permission Matrix
          </h2>
          <p className="text-2xs text-gray-500 font-mono">Manage database-level security policies. Map fine-grained permissions to user groups.</p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="p-4 bg-gray-950 border-gray-850 flex gap-3 items-start">
        <Shield className="text-yellow-500 shrink-0 mt-0.5" size={18} />
        <div className="text-2xs text-gray-400 space-y-1">
          <p className="font-bold text-white uppercase tracking-wider font-mono">Security Precautionary Rule:</p>
          <p>
            The <strong className="text-red-400">super_admin</strong> role is configured with god-mode settings and possesses all app permissions by default. 
            Modifications to the Super Admin role are protected to prevent system locking.
          </p>
        </div>
      </Card>

      {/* Role-Permission Matrix Table */}
      <Card className="bg-gray-950 border-gray-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-900 text-gray-300 font-semibold border-b border-gray-800">
              <tr>
                <th className="px-6 py-4 w-1/3">Permission Specification</th>
                {roles.map((r) => (
                  <th key={r.id} className="px-6 py-4 text-center">
                    <span className="text-xs font-bold text-white">{r.name.toUpperCase()}</span>
                    <p className="text-4xs text-gray-500 font-mono mt-0.5 truncate max-w-[120px] mx-auto">{r.description}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {permissions.map((perm) => (
                <tr key={perm.id} className="hover:bg-gray-900/20">
                  <td className="px-6 py-4">
                    <div className="font-bold text-white font-mono">{perm.name}</div>
                    <div className="text-3xs text-gray-500 font-mono mt-0.5">{perm.description}</div>
                  </td>
                  
                  {roles.map((role) => {
                    const assigned = isAssigned(role.id, perm.id) || role.name === 'super_admin';
                    const cellKey = `${role.id}-${perm.id}`;
                    const activeProcessing = processing === cellKey;
                    
                    return (
                      <td key={role.id} className="px-6 py-4 text-center">
                        {activeProcessing ? (
                          <div className="h-4 w-4 animate-spin rounded-full border border-red-500 border-t-transparent mx-auto" />
                        ) : (
                          <input
                            type="checkbox"
                            checked={assigned}
                            disabled={role.name === 'super_admin'}
                            onChange={() => handleTogglePermission(role, perm, isAssigned(role.id, perm.id))}
                            className={`w-4 h-4 rounded bg-gray-900 border-gray-800 text-red-600 focus:ring-red-500/50 cursor-pointer ${
                              role.name === 'super_admin' ? 'cursor-not-allowed opacity-55 text-red-950' : ''
                            }`}
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
export default RoleManagementPage;
