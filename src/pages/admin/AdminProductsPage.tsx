import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Flag, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../i18n/I18nContext';
import { useToast } from '../../components/ui/Toast';
import { AdminLayout } from './AdminLayout';
import { Badge, Button } from '../../components/ui';
import { formatPrice, statusColors } from '../../lib/utils';
import type { ProductWithRelations } from '../../types';

export function AdminProductsPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'flagged' | 'pending' | 'all'>('flagged');

  const { data: products } = useQuery({
    queryKey: ['admin-products', filter],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*, seller:profiles(*), category:categories(*), product_images(*)')
        .order('created_at', { ascending: false });
      if (filter === 'flagged') query = query.eq('status', 'flagged');
      else if (filter === 'pending') query = query.eq('status', 'pending');
      const { data } = await query.limit(50);
      return (data ?? []) as ProductWithRelations[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await supabase.from('products').update({ status }).eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast('Product updated', 'success');
    },
  });

  const tabs = [
    { key: 'flagged', label: t('admin.flagged'), icon: <Flag size={16} /> },
    { key: 'pending', label: t('status.pending'), icon: <AlertTriangle size={16} /> },
    { key: 'all', label: t('common.all'), icon: null },
  ] as const;

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">{t('admin.products')}</h1>

      <div className="flex gap-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === tab.key ? 'bg-primary-500 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {products?.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl shadow-card p-4 flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-neutral-100 overflow-hidden shrink-0">
              {p.product_images?.[0] && <img src={p.product_images[0].url} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-neutral-900 truncate">{p.title}</p>
              <p className="text-sm text-neutral-500">{formatPrice(p.price)} • {p.seller?.full_name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[p.status]}`}>
                  {t(`status.${p.status}` as any)}
                </span>
                {p.risk_score > 0 && (
                  <Badge variant={p.risk_score > 0.7 ? 'error' : 'warning'}>
                    {t('admin.riskScore')}: {(p.risk_score * 100).toFixed(0)}%
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {p.status === 'pending' && (
                <>
                  <Button size="sm" onClick={() => updateStatus.mutate({ id: p.id, status: 'active' })}>
                    <Check size={14} /> {t('admin.approve')}
                  </Button>
                  <Button variant="outline" size="sm" className="text-error-500" onClick={() => updateStatus.mutate({ id: p.id, status: 'rejected' })}>
                    <X size={14} /> {t('admin.reject')}
                  </Button>
                </>
              )}
              {p.status === 'flagged' && (
                <>
                  <Button size="sm" onClick={() => updateStatus.mutate({ id: p.id, status: 'active' })}>
                    <Check size={14} /> {t('admin.approve')}
                  </Button>
                  <Button variant="outline" size="sm" className="text-error-500" onClick={() => updateStatus.mutate({ id: p.id, status: 'rejected' })}>
                    <X size={14} /> {t('admin.reject')}
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
