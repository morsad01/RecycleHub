import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, Button, Input, Select, Badge } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { 
  Search, 
  UserX, 
  UserCheck, 
  Trash2, 
  Key, 
  UserCog, 
  History, 
  FileText, 
  UserPlus,
  ArrowRight,
  ShieldAlert,
  Smartphone,
  MapPin,
  Globe
} from 'lucide-react';
import { formatPrice } from '../../lib/utils';
import type { Profile, LoginHistory } from '../../types';

export function UserManagementPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

  // Modals / Action States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);

  // Forms
  const [newUser, setNewUser] = useState({ email: '', password: '', fullName: '', role: 'user' });
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('');
  
  // Audits & Sessions for Selected User
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any | null>(null);

  // Fetch Users
  async function fetchUsers() {
    try {
      setLoading(true);
      let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
      
      if (search.trim()) {
        query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
      }
      if (roleFilter) {
        query = query.eq('role', roleFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setUsers((data as Profile[]) || []);
    } catch (err: any) {
      toast('Failed to load users: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter]);

  // Load details when user is selected
  useEffect(() => {
    if (!selectedUser) {
      setLoginHistory([]);
      setAuditLogs([]);
      setVerifications(null);
      return;
    }

    const userId = selectedUser.id;
    async function loadUserDetails() {
      // 1. Fetch Login History
      const { data: hist } = await supabase
        .from('login_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      setLoginHistory((hist as LoginHistory[]) || []);

      // 2. Fetch Audit Logs
      const { data: audits } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(15);
      setAuditLogs(audits || []);

      // 3. Fetch Verification Details
      const { data: verif } = await supabase
        .from('seller_verifications')
        .select('*')
        .eq('seller_id', userId)
        .maybeSingle();
      setVerifications(verif);
    }

    loadUserDetails();
  }, [selectedUser]);

  // Create User via Super Admin RPC
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.password || !newUser.fullName) {
      toast('Please fill all fields', 'error');
      return;
    }
    
    try {
      const { data, error } = await supabase.rpc('admin_create_user', {
        user_email: newUser.email,
        user_password: newUser.password,
        user_full_name: newUser.fullName,
        user_role: newUser.role
      });
      if (error) throw error;
      toast('User Account Created Successfully!', 'success');
      setShowCreateModal(false);
      setNewUser({ email: '', password: '', fullName: '', role: 'user' });
      fetchUsers();
    } catch (err: any) {
      toast(err.message || 'Creation failed.', 'error');
    }
  };

  // Toggle Ban Status
  const handleToggleBan = async (user: Profile) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: !user.is_banned })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast(user.is_banned ? 'User Unbanned.' : 'User Suspended/Banned.', 'success');
      setSelectedUser(prev => prev && prev.id === user.id ? { ...prev, is_banned: !user.is_banned } : prev);
      fetchUsers();
    } catch (err: any) {
      toast('Operation failed: ' + err.message, 'error');
    }
  };

  // Change Password via Super Admin RPC
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword) return;

    try {
      const { error } = await supabase.rpc('admin_reset_password', {
        target_user_id: selectedUser.id,
        new_password: newPassword
      });
      if (error) throw error;
      toast('Password Reset Complete.', 'success');
      setShowPasswordModal(false);
      setNewPassword('');
    } catch (err: any) {
      toast('Password reset failed: ' + err.message, 'error');
    }
  };

  // Update Role (public.profiles & public.user_roles)
  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newRole) return;

    try {
      // 1. Update profiles table
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', selectedUser.id);
      if (profileErr) throw profileErr;

      // 2. Sync user_roles table
      const { data: roleData } = await supabase
        .from('app_roles')
        .select('id')
        .eq('name', newRole)
        .single();

      if (roleData) {
        // Delete existing roles and insert new one
        await supabase.from('user_roles').delete().eq('user_id', selectedUser.id);
        await supabase.from('user_roles').insert({ user_id: selectedUser.id, role_id: roleData.id });
      }

      toast('User Role Updated.', 'success');
      setSelectedUser(prev => prev ? { ...prev, role: newRole as any } : null);
      setShowRoleModal(false);
      setNewRole('');
      fetchUsers();
    } catch (err: any) {
      toast('Role change failed: ' + err.message, 'error');
    }
  };

  // Delete User via Super Admin RPC
  const handleDeleteUser = async (user: Profile) => {
    if (!confirm(`Are you absolutely sure you want to permanently delete user ${user.full_name}? This action CANNOT be undone.`)) return;

    try {
      const { error } = await supabase.rpc('admin_delete_user', {
        target_user_id: user.id
      });
      if (error) throw error;
      toast('Account Permanently Deleted.', 'success');
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      toast('Deletion failed: ' + err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white">User & Seller Directory</h2>
          <p className="text-2xs text-gray-500 font-mono">Control roles, ban status, verifications, and audit user sessions.</p>
        </div>
        <Button className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5" onClick={() => setShowCreateModal(true)}>
          <UserPlus size={16} /> Create User Account
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-500" />
          </span>
          <Input
            placeholder="Search by full name or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-gray-950 border-gray-800 text-white placeholder-gray-600"
          />
        </div>
        <Select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-gray-950 border-gray-800 text-white"
        >
          <option value="">All Roles</option>
          <option value="user">User / Seller</option>
          <option value="moderator">Moderator</option>
          <option value="support">Support</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </Select>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Users Table */}
        <div className="flex-1">
          <Card className="bg-gray-950 border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-900/60 text-gray-400 font-semibold border-b border-gray-800">
                  <tr>
                    <th className="px-5 py-3">Full Name / Profile</th>
                    <th className="px-5 py-3">Phone</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {loading && users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500 font-mono">Querying directory...</td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500 font-mono">No matching records found.</td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr 
                        key={u.id} 
                        className={`hover:bg-gray-900/40 cursor-pointer transition-colors ${selectedUser?.id === u.id ? 'bg-red-950/20' : ''}`}
                        onClick={() => setSelectedUser(u)}
                      >
                        <td className="px-5 py-4">
                          <div className="font-semibold text-white">{u.full_name}</div>
                          <div className="text-3xs text-gray-500 font-mono">{u.id}</div>
                        </td>
                        <td className="px-5 py-4 text-gray-300 font-mono">{u.phone || 'N/A'}</td>
                        <td className="px-5 py-4">
                          <Badge 
                            className={
                              u.role === 'super_admin' ? 'bg-red-950/80 border border-red-500/30 text-red-400' :
                              u.role === 'admin' ? 'bg-blue-950/80 border border-blue-500/30 text-blue-400' :
                              u.role === 'moderator' ? 'bg-yellow-950/80 border border-yellow-500/30 text-yellow-400' :
                              u.role === 'support' ? 'bg-purple-950/80 border border-purple-500/30 text-purple-400' :
                              'bg-gray-900 text-gray-400 border border-gray-800'
                            }
                          >
                            {u.role.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-5 py-4">
                          {u.is_banned ? (
                            <Badge variant="error" className="bg-red-950/40 border border-red-500/20 text-red-500">Banned</Badge>
                          ) : (
                            <Badge variant="success" className="bg-emerald-950/40 border border-emerald-500/20 text-emerald-500">Active</Badge>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleToggleBan(u)}
                              className={u.is_banned ? 'text-emerald-500 hover:bg-emerald-950/20' : 'text-red-500 hover:bg-red-950/20'}
                              title={u.is_banned ? 'Unban User' : 'Ban User'}
                            >
                              {u.is_banned ? <UserCheck size={14} /> : <UserX size={14} />}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => { setSelectedUser(u); setShowRoleModal(true); }}
                              className="text-gray-400 hover:bg-gray-800 hover:text-white"
                              title="Modify Role"
                            >
                              <UserCog size={14} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteUser(u)}
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

        {/* Selected User Details Sidebar / Panel */}
        {selectedUser && (
          <div className="w-full lg:w-96 shrink-0 space-y-6">
            <Card className="bg-gray-950 border-gray-800 p-5 space-y-6">
              {/* Close Panel Button */}
              <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                <h3 className="font-bold text-white text-sm font-mono tracking-wider">SECURE DETAILED VIEW</h3>
                <button onClick={() => setSelectedUser(null)} className="text-xs text-gray-500 hover:text-white">✕ Close</button>
              </div>

              {/* User Bio and Meta */}
              <div className="space-y-2">
                <div className="text-center py-2">
                  <div className="w-16 h-16 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-xl font-bold text-white mx-auto overflow-hidden">
                    {selectedUser.avatar_url ? (
                      <img src={selectedUser.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      selectedUser.full_name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <h4 className="font-bold text-white text-md mt-2">{selectedUser.full_name}</h4>
                  <p className="text-3xs text-gray-500 font-mono select-all">{selectedUser.id}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-2xs font-mono p-3 bg-gray-900/60 border border-gray-800/40 rounded-xl">
                  <div>
                    <span className="text-gray-500 block">ACCOUNT ROLE:</span>
                    <span className="text-white font-bold">{selectedUser.role.toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">SELLER ACCESS:</span>
                    <span className={selectedUser.is_seller_verified ? 'text-emerald-400 font-bold' : 'text-gray-400'}>
                      {selectedUser.is_seller_verified ? 'VERIFIED' : 'UNVERIFIED'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions panel */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-gray-800 text-gray-300 flex items-center justify-center gap-1.5"
                  onClick={() => setShowPasswordModal(true)}
                >
                  <Key size={12} /> Reset Password
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-gray-800 text-gray-300 flex items-center justify-center gap-1.5"
                  onClick={() => handleToggleBan(selectedUser)}
                >
                  {selectedUser.is_banned ? <UserCheck size={12} /> : <UserX size={12} />}
                  {selectedUser.is_banned ? 'Unban User' : 'Suspend Account'}
                </Button>
              </div>

              {/* Verifications Documents Preview */}
              {verifications && (
                <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl space-y-3">
                  <div className="flex items-center gap-1.5 text-2xs font-bold text-white border-b border-gray-800 pb-1.5">
                    <FileText size={14} className="text-red-500" /> verification documents
                  </div>
                  <div className="text-2xs space-y-2">
                    {verifications.nid_number && <p className="text-gray-400">NID: <strong className="text-white">{verifications.nid_number}</strong></p>}
                    
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {verifications.nid_image_url && (
                        <a href={verifications.nid_image_url} target="_blank" rel="noreferrer" className="block border border-gray-800 rounded-lg overflow-hidden relative aspect-video bg-black group">
                          <img src={verifications.nid_image_url} alt="NID" className="w-full h-full object-cover" />
                          <span className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white">View NID</span>
                        </a>
                      )}
                      {verifications.selfie_image_url && (
                        <a href={verifications.selfie_image_url} target="_blank" rel="noreferrer" className="block border border-gray-800 rounded-lg overflow-hidden relative aspect-video bg-black group">
                          <img src={verifications.selfie_image_url} alt="Selfie" className="w-full h-full object-cover" />
                          <span className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white">View Selfie</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Login Session History */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-2xs font-bold text-white border-b border-gray-800 pb-1.5">
                  <History size={14} className="text-red-500" /> Recent login attempts
                </div>
                {loginHistory.length === 0 ? (
                  <p className="text-3xs text-gray-500 font-mono py-1">No recorded login logs found.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {loginHistory.map((h) => (
                      <div key={h.id} className="text-3xs font-mono p-2 bg-gray-900 border border-gray-800/40 rounded-lg space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-400 flex items-center gap-0.5"><MapPin size={8} /> {h.location || 'Unknown'}</span>
                          <span className={h.status === 'success' ? 'text-emerald-500 font-bold' : 'text-red-500 font-bold'}>
                            {h.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span className="flex items-center gap-0.5"><Globe size={8} /> {h.ip_address || 'No IP'}</span>
                          <span>{new Date(h.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Audit logs timeline */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-2xs font-bold text-white border-b border-gray-800 pb-1.5">
                  <ShieldAlert size={14} className="text-red-500" /> DB Activity logs
                </div>
                {auditLogs.length === 0 ? (
                  <p className="text-3xs text-gray-500 font-mono py-1">No database changes captured.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="text-3xs font-mono p-2 bg-gray-900/60 border border-gray-800/60 rounded-lg">
                        <div className="flex justify-between text-gray-400">
                          <span className="font-bold text-red-400">{log.action}</span>
                          <span>{new Date(log.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-gray-500 mt-1">Table: <strong className="text-white">{log.table_name}</strong></p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* --- CREATE USER MODAL --- */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <Card className="bg-gray-900 border-gray-800 p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2 border-b border-gray-800 pb-2">
              <UserPlus className="text-red-500" size={18} /> CREATE ADMIN / USER ACCOUNT
            </h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <Input
                label="Full Name"
                value={newUser.fullName}
                onChange={(e) => setNewUser(prev => ({ ...prev, fullName: e.target.value }))}
                className="bg-gray-950 border-gray-800 text-white"
                required
              />
              <Input
                label="Email Address"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                className="bg-gray-950 border-gray-800 text-white"
                required
              />
              <Input
                label="Temp Password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                className="bg-gray-950 border-gray-800 text-white"
                required
              />
              <Select
                label="Assigned System Role"
                value={newUser.role}
                onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                className="bg-gray-950 border-gray-800 text-white"
              >
                <option value="user">User / Seller</option>
                <option value="moderator">Moderator</option>
                <option value="support">Support</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </Select>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" className="border-gray-800 text-gray-400" type="button" onClick={() => setShowCreateModal(false)}>
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
            <p className="text-3xs text-gray-500 font-mono mb-4">Set a temporary credentials code for {selectedUser?.full_name}.</p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <Input
                label="New Password"
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
                  Reset Password
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* --- MODIFY ROLE MODAL --- */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <Card className="bg-gray-900 border-gray-800 p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2 border-b border-gray-800 pb-2">
              <UserCog className="text-red-500" size={18} /> MODIFY SYSTEM ROLE
            </h3>
            <p className="text-3xs text-gray-500 font-mono mb-4">Change the access level for {selectedUser?.full_name}.</p>
            <form onSubmit={handleUpdateRole} className="space-y-4">
              <Select
                label="Select Role"
                value={newRole || selectedUser?.role}
                onChange={(e) => setNewRole(e.target.value)}
                className="bg-gray-950 border-gray-800 text-white"
              >
                <option value="user">User / Seller</option>
                <option value="moderator">Moderator</option>
                <option value="support">Support</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </Select>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" className="border-gray-800 text-gray-400" type="button" onClick={() => setShowRoleModal(false)}>
                  Cancel
                </Button>
                <Button className="bg-red-600 hover:bg-red-700 text-white" type="submit">
                  Apply Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
export default UserManagementPage;
