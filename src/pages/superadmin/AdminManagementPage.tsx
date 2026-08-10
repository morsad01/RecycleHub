import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, Button, Input, Select, Badge } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { 
  UserPlus, 
  Shield, 
  Activity,
  UserX,
  UserCheck,
  Key,
  Trash2,
  Lock,
  MoreVertical
} from 'lucide-react';
import type { Profile } from '../../types';

export function AdminManagementPage() {
  const { toast } = useToast();
  const [admins, setAdmins] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Audits & Modals
  const [selectedAdmin, setSelectedAdmin] = useState<Profile | null>(null);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // Form fields
  const [inviteForm, setInviteForm] = useState({ email: '', password: '', fullName: '', role: 'admin' });
  const [newPassword, setNewPassword] = useState('');

  async function fetchAdmins() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['admin', 'super_admin', 'moderator', 'support'])
        .order('role', { ascending: true });
        
      if (error) throw error;
      setAdmins((data as Profile[]) || []);
    } catch (err: any) {
      toast('Failed to load system administrators: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Fetch admin logs when an admin is selected
  useEffect(() => {
    if (!selectedAdmin) {
      setAdminLogs([]);
      return;
    }

    const adminId = selectedAdmin.id;
    async function fetchAdminLogs() {
      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', adminId)
        .order('created_at', { ascending: false })
        .limit(10);
      setAdminLogs(data || []);
    }

    fetchAdminLogs();
  }, [selectedAdmin]);

  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.email || !inviteForm.password || !inviteForm.fullName) {
      toast('Please fill all fields', 'error');
      return;
    }

    try {
      const { error } = await supabase.rpc('admin_create_user', {
        user_email: inviteForm.email,
        user_password: inviteForm.password,
        user_full_name: inviteForm.fullName,
        user_role: inviteForm.role
      });

      if (error) throw error;
      toast('Administrative Account Created.', 'success');
      setShowInviteModal(false);
      setInviteForm({ email: '', password: '', fullName: '', role: 'admin' });
      fetchAdmins();
    } catch (err: any) {
      toast(err.message || 'Failed to create admin.', 'error');
    }
  };

  const handleToggleAccess = async (admin: Profile) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: !admin.is_banned })
        .eq('id', admin.id);
        
      if (error) throw error;
      toast(admin.is_banned ? 'Admin Access Restored.' : 'Admin Access Suspended.', 'success');
      setSelectedAdmin(prev => prev && prev.id === admin.id ? { ...prev, is_banned: !admin.is_banned } : prev);
      fetchAdmins();
    } catch (err: any) {
      toast('Failed to change access: ' + err.message, 'error');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin || !newPassword) return;

    try {
      const { error } = await supabase.rpc('admin_reset_password', {
        target_user_id: selectedAdmin.id,
        new_password: newPassword
      });
      if (error) throw error;
      toast('Admin password successfully reset.', 'success');
      setShowPasswordModal(false);
      setNewPassword('');
    } catch (err: any) {
      toast('Failed to reset password: ' + err.message, 'error');
    }
  };

  const handleDeleteAdmin = async (admin: Profile) => {
    if (!confirm(`Are you absolutely sure you want to permanently delete administrative account: ${admin.full_name}?`)) return;

    try {
      const { error } = await supabase.rpc('admin_delete_user', {
        target_user_id: admin.id
      });
      if (error) throw error;
      toast('Admin account deleted permanently.', 'success');
      setSelectedAdmin(null);
      fetchAdmins();
    } catch (err: any) {
      toast('Failed to delete account: ' + err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex justify-between items-center border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Lock className="text-red-500" size={20} /> System Administrator Directory
          </h2>
          <p className="text-2xs text-gray-500 font-mono">Create and manage administrative accounts, assign RBAC permissions, and monitor action logs.</p>
        </div>
        <Button className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5" onClick={() => setShowInviteModal(true)}>
          <UserPlus size={16} /> Add System Staff
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Table list */}
        <div className="flex-1">
          <Card className="bg-gray-950 border-gray-800 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-900/60 text-gray-400 font-semibold border-b border-gray-800">
                  <tr>
                    <th className="px-6 py-4">System User</th>
                    <th className="px-6 py-4">App Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {loading && admins.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-gray-500 font-mono">Loading staff directory...</td>
                    </tr>
                  ) : admins.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-gray-500 font-mono">No administrative staff found.</td>
                    </tr>
                  ) : (
                    admins.map((admin) => (
                      <tr 
                        key={admin.id} 
                        className={`hover:bg-gray-900/40 cursor-pointer transition-colors ${selectedAdmin?.id === admin.id ? 'bg-red-950/20' : ''}`}
                        onClick={() => setSelectedAdmin(admin)}
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white">{admin.full_name}</div>
                          <div className="text-3xs text-gray-500 font-mono select-all">{admin.id}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-2xs font-semibold ${
                            admin.role === 'super_admin' ? 'bg-red-950/80 border border-red-500/30 text-red-400' :
                            admin.role === 'admin' ? 'bg-blue-950/80 border border-blue-500/30 text-blue-400' :
                            admin.role === 'moderator' ? 'bg-yellow-950/80 border border-yellow-500/30 text-yellow-400' :
                            'bg-purple-950/80 border border-purple-500/30 text-purple-400'
                          }`}>
                            <Shield size={12} /> {admin.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {admin.is_banned ? (
                            <Badge variant="error" className="bg-red-950/40 border border-red-500/20 text-red-500">Suspended</Badge>
                          ) : (
                            <Badge variant="success" className="bg-emerald-950/40 border border-emerald-500/20 text-emerald-500">Active</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleToggleAccess(admin)}
                              className={admin.is_banned ? 'text-emerald-500 hover:bg-emerald-950/20' : 'text-red-500 hover:bg-red-950/20'}
                              title={admin.is_banned ? 'Enable Account' : 'Suspend Account'}
                            >
                              {admin.is_banned ? <UserCheck size={14} /> : <UserX size={14} />}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => { setSelectedAdmin(admin); setShowPasswordModal(true); }}
                              className="text-gray-400 hover:bg-gray-800 hover:text-white"
                              title="Reset Password"
                            >
                              <Key size={14} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteAdmin(admin)}
                              className="text-red-500 hover:bg-red-950/40"
                              title="Delete Account"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Selected Admin Operations panel */}
        {selectedAdmin && (
          <div className="w-full lg:w-96 shrink-0 space-y-6">
            <Card className="bg-gray-950 border-gray-800 p-5 space-y-5 shadow-2xl">
              <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                <h3 className="font-bold text-white text-sm font-mono tracking-wider">STAFF AUDIT LOG</h3>
                <button onClick={() => setSelectedAdmin(null)} className="text-xs text-gray-500 hover:text-white">✕ Close</button>
              </div>

              <div>
                <h4 className="font-bold text-white text-sm">{selectedAdmin.full_name}</h4>
                <p className="text-3xs text-gray-500 font-mono">{selectedAdmin.id}</p>
                <div className="mt-2 flex gap-2">
                  <Badge className="bg-gray-900 border-gray-800 text-gray-400">{selectedAdmin.role.toUpperCase()}</Badge>
                  {selectedAdmin.is_banned ? (
                    <Badge variant="error" className="bg-red-950/40 border border-red-500/20 text-red-500">Disabled</Badge>
                  ) : (
                    <Badge variant="success" className="bg-emerald-950/40 border border-emerald-500/20 text-emerald-500">Active</Badge>
                  )}
                </div>
              </div>

              {/* Action History logs */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-1.5 text-2xs font-bold text-white border-b border-gray-800 pb-1.5">
                  <Activity size={14} className="text-red-500" /> Recent Actions Performed
                </div>
                {adminLogs.length === 0 ? (
                  <p className="text-3xs text-gray-500 font-mono py-1">No admin actions recorded in audit logs.</p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {adminLogs.map((log) => (
                      <div key={log.id} className="text-3xs font-mono p-3 bg-gray-900 border border-gray-850 rounded-xl space-y-1">
                        <div className="flex justify-between">
                          <span className="font-bold text-red-400">{log.action}</span>
                          <span className="text-gray-500">{new Date(log.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-gray-400">Modified Table: <strong className="text-white">{log.table_name}</strong></p>
                        <p className="text-gray-400">Record ID: <span className="text-gray-500 font-mono">{log.record_id}</span></p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* --- ADD SYSTEM STAFF MODAL --- */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <Card className="bg-gray-900 border-gray-800 p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2 border-b border-gray-800 pb-2">
              <UserPlus className="text-red-500" size={18} /> ESTABLISH SYSTEM STAFF
            </h3>
            <form onSubmit={handleInviteAdmin} className="space-y-4">
              <Input
                label="Full Name"
                value={inviteForm.fullName}
                onChange={(e) => setInviteForm(prev => ({ ...prev, fullName: e.target.value }))}
                className="bg-gray-950 border-gray-800 text-white"
                required
              />
              <Input
                label="Email Address"
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                className="bg-gray-950 border-gray-800 text-white"
                required
              />
              <Input
                label="Temp Password"
                type="password"
                value={inviteForm.password}
                onChange={(e) => setInviteForm(prev => ({ ...prev, password: e.target.value }))}
                className="bg-gray-950 border-gray-800 text-white"
                required
              />
              <Select
                label="Assigned System Role"
                value={inviteForm.role}
                onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value }))}
                className="bg-gray-950 border-gray-800 text-white"
              >
                <option value="admin">General Admin</option>
                <option value="moderator">Moderator</option>
                <option value="support">Support Personnel</option>
              </Select>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" className="border-gray-800 text-gray-400" type="button" onClick={() => setShowInviteModal(false)}>
                  Cancel
                </Button>
                <Button className="bg-red-600 hover:bg-red-700 text-white" type="submit">
                  Establish Account
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* --- RESET PASSWORD MODAL --- */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <Card className="bg-gray-900 border-gray-800 p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2 border-b border-gray-800 pb-2">
              <Key className="text-red-500" size={18} /> RESET CREDENTIAL CODE
            </h3>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <Input
                label="Temporary Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-gray-950 border-gray-800 text-white"
                required
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" className="border-gray-800 text-gray-400" type="button" onClick={() => setShowPasswordModal(false)}>
                  Cancel
                </Button>
                <Button className="bg-red-600 hover:bg-red-700 text-white" type="submit">
                  Apply Reset
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
export default AdminManagementPage;
