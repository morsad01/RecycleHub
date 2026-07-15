import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../i18n/I18nContext';
import { AdminLayout } from './AdminLayout';
import { formatPrice, formatDate, orderStatusColors } from '../../lib/utils';
import type { Order } from '../../types';

export function AdminOrdersPage() {
  const { t } = useI18n();

  const { data: orders } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, buyer:profiles!buyer_id(*), seller:profiles!seller_id(*), product:products(*)')
        .order('created_at', { ascending: false })
        .limit(50);
      return (data ?? []) as Order[];
    },
  });

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">{t('admin.orders')}</h1>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-100">
            <tr>
              <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3">Product</th>
              <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3 hidden sm:table-cell">Buyer</th>
              <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3 hidden sm:table-cell">Seller</th>
              <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3">Total</th>
              <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3">Status</th>
              <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3 hidden sm:table-cell">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {orders?.map((o) => (
              <tr key={o.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3 text-sm font-medium text-neutral-900 truncate max-w-32">{o.product?.title ?? '-'}</td>
                <td className="px-4 py-3 text-sm text-neutral-500 hidden sm:table-cell">{o.buyer?.full_name}</td>
                <td className="px-4 py-3 text-sm text-neutral-500 hidden sm:table-cell">{o.seller?.full_name}</td>
                <td className="px-4 py-3 text-sm font-medium text-neutral-900">{formatPrice(o.total_amount)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${orderStatusColors[o.status as keyof typeof orderStatusColors] ?? 'bg-neutral-200'}`}>
                    {t(`orderStatus.${o.status}` as any)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-neutral-500 hidden sm:table-cell">{formatDate(o.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
