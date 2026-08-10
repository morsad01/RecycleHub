import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../auth/AuthContext';
import { useI18n } from '../../i18n/I18nContext';
import { useToast } from '../../components/ui/Toast';
import { AdminLayout } from './AdminLayout';
import { Avatar, Badge, Button } from '../../components/ui';
import { formatDate, toDirectGoogleDriveUrl } from '../../lib/utils';
import type { SellerVerification, Profile } from '../../types';

export function AdminVerificationsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: verifications } = useQuery({
    queryKey: ['admin-verifications'],
    queryFn: async () => {
      const { data } = await supabase
        .from('seller_verifications')
        .select('*, seller:profiles!seller_id(*)')
        .order('created_at', { ascending: false });
      return (data ?? []) as (SellerVerification & { seller: Profile })[];
    },
  });

  const review = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => {
      await supabase.from('seller_verifications').update({ status, reviewed_by: user!.id }).eq('id', id);
      const verif = verifications?.find((v) => v.id === id);
      if (verif && status === 'approved') {
        await supabase.from('profiles').update({ is_seller_verified: true }).eq('id', verif.seller_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
      toast('Verification reviewed', 'success');
    },
  });

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">{t('admin.verifications')}</h1>

      <div className="space-y-3">
        {verifications?.map((v) => (
          <div key={v.id} className="bg-white rounded-2xl shadow-card p-5">
            <div className="flex items-start gap-4">
              <Avatar src={v.seller?.avatar_url} name={v.seller?.full_name} size={48} />
              <div className="flex-1">
                <p className="font-medium text-neutral-900">{v.seller?.full_name}</p>
                <p className="text-xs text-neutral-500">Submitted {formatDate(v.created_at)}</p>
                <div className="mt-2 space-y-1">
                  {v.nid_number && <p className="text-sm text-neutral-600">NID: {v.nid_number}</p>}
                  {v.business_info && <p className="text-sm text-neutral-600">Business: {v.business_info}</p>}
                  {v.nid_image_url && (
                    <a
                      href={toDirectGoogleDriveUrl(v.nid_image_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:underline"
                    >
                      View NID Document
                    </a>
                  )}
                </div>
                <div className="mt-2">
                  <Badge variant={v.status === 'approved' ? 'success' : v.status === 'rejected' ? 'error' : 'warning'}>
                    {v.status}
                  </Badge>
                </div>
              </div>
              {v.status === 'pending' && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => review.mutate({ id: v.id, status: 'approved' })}>
                    <Check size={14} /> {t('admin.approve')}
                  </Button>
                  <Button variant="outline" size="sm" className="text-error-500" onClick={() => review.mutate({ id: v.id, status: 'rejected' })}>
                    <X size={14} /> {t('admin.reject')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
        {verifications?.length === 0 && (
          <p className="text-sm text-neutral-500 text-center py-8">No verification requests.</p>
        )}
      </div>
    </AdminLayout>
  );
}
