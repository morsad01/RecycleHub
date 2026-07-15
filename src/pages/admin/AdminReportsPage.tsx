import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Flag } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../i18n/I18nContext';
import { useToast } from '../../components/ui/Toast';
import { AdminLayout } from './AdminLayout';
import { Badge, Button } from '../../components/ui';
import { formatDate } from '../../lib/utils';
import type { Report } from '../../types';

export function AdminReportsPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reports } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => {
      const { data } = await supabase
        .from('reports')
        .select('*, reporter:profiles!reporter_id(*), reported_user:profiles!reported_user_id(*), reported_product:products(*)')
        .order('created_at', { ascending: false });
      return (data ?? []) as Report[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await supabase.from('reports').update({ status }).eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      toast('Report updated', 'success');
    },
  });

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">{t('admin.reports')}</h1>

      <div className="space-y-3">
        {reports?.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl shadow-card p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-error-50 text-error-500 flex items-center justify-center shrink-0">
                <Flag size={18} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-neutral-900">{r.reason}</p>
                {r.description && <p className="text-sm text-neutral-600 mt-1">{r.description}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-neutral-500">By {r.reporter?.full_name}</span>
                  <span className="text-xs text-neutral-400">• {formatDate(r.created_at)}</span>
                  <Badge variant={r.status === 'resolved' ? 'success' : r.status === 'dismissed' ? 'neutral' : 'warning'}>
                    {r.status}
                  </Badge>
                </div>
              </div>
              {r.status === 'open' && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: r.id, status: 'resolved' })}>
                    <Check size={14} /> {t('admin.resolve')}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-error-500" onClick={() => updateStatus.mutate({ id: r.id, status: 'dismissed' })}>
                    <X size={14} /> {t('admin.dismiss')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
        {reports?.length === 0 && (
          <p className="text-sm text-neutral-500 text-center py-8">No reports.</p>
        )}
      </div>
    </AdminLayout>
  );
}
