import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Ban, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../i18n/I18nContext';
import { useToast } from '../../components/ui/Toast';
import { AdminLayout } from './AdminLayout';
import { Avatar, Badge, Button, Input } from '../../components/ui';
import { formatDate } from '../../lib/utils';
import type { Profile } from '../../types';

export function AdminUsersPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: users } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: async () => {
      let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (search) query = query.ilike('full_name', `%${search}%`);
      const { data } = await query.limit(50);
      return (data ?? []) as Profile[];
    },
  });

  const toggleBan = useMutation({
    mutationFn: async ({ id, isBanned }: { id: string; isBanned: boolean }) => {
      await supabase.from('profiles').update({ is_banned: !isBanned }).eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast('User updated', 'success');
    },
  });

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">{t('admin.users')}</h1>

      <div className="mb-4 max-w-sm">
        <Input icon={<Search size={18} />} placeholder={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-100">
            <tr>
              <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3">User</th>
              <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3 hidden sm:table-cell">Role</th>
              <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3 hidden sm:table-cell">Joined</th>
              <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3">Status</th>
              <th className="text-right text-xs font-medium text-neutral-500 px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {users?.map((u) => (
              <tr key={u.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar src={u.avatar_url} name={u.full_name} size={36} />
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{u.full_name}</p>
                      <p className="text-xs text-neutral-500">{u.phone ?? 'No phone'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  {u.role === 'super_admin' ? (
                    <Badge variant="primary" className="bg-red-900/40 text-red-500 border border-red-500/20">Super Admin</Badge>
                  ) : u.role === 'admin' ? (
                    <Badge variant="primary">{t('nav.admin')}</Badge>
                  ) : (
                    <Badge variant="neutral">User</Badge>
                  )}
                  {u.is_seller_verified && <Badge variant="success" className="ml-1"><ShieldCheck size={10} /> Verified</Badge>}
                </td>
                <td className="px-4 py-3 text-sm text-neutral-500 hidden sm:table-cell">{formatDate(u.created_at)}</td>
                <td className="px-4 py-3">
                  {u.is_banned ? <Badge variant="error">Banned</Badge> : <Badge variant="success">Active</Badge>}
                </td>
                <td className="px-4 py-3 text-right">
                  {u.role !== 'admin' && u.role !== 'super_admin' && (
                    <Button
                      variant={u.is_banned ? 'outline' : 'ghost'}
                      size="sm"
                      onClick={() => toggleBan.mutate({ id: u.id, isBanned: u.is_banned })}
                      className={u.is_banned ? '' : 'text-error-500'}
                    >
                      <Ban size={14} /> {u.is_banned ? t('admin.unban') : t('admin.ban')}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
