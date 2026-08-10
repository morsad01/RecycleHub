import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Check, Truck, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { useToast } from '../components/ui/Toast';
import { Button, Modal, Textarea, StarRating } from '../components/ui';
import { EmptyState } from '../components/ui/EmptyState';
import { formatPrice, formatDate, orderStatusColors, orderTimeline } from '../lib/utils';
import type { Order } from '../types';

export function OrdersPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'buying' | 'selling'>('buying');
  const [reviewingOrder, setReviewingOrder] = useState<Order | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', tab],
    queryFn: async () => {
      const col = tab === 'buying' ? 'buyer_id' : 'seller_id';
      const { data } = await supabase
        .from('orders')
        .select('*, buyer:profiles!buyer_id(*), seller:profiles!seller_id(*), product:products(*)')
        .eq(col, user!.id)
        .order('created_at', { ascending: false });
      return (data ?? []) as Order[];
    },
    enabled: !!user,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await supabase.from('orders').update({ status }).eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast('Order updated', 'success');
    },
  });

  const submitReview = async () => {
    if (!user || !reviewingOrder) return;
    await supabase.from('reviews').insert({
      order_id: reviewingOrder.id,
      reviewer_id: user.id,
      reviewee_id: tab === 'buying' ? reviewingOrder.seller_id : reviewingOrder.buyer_id,
      product_id: reviewingOrder.product_id,
      rating,
      comment,
    });
    toast(t('reviews.submit'), 'success');
    setReviewingOrder(null);
    setComment('');
    setRating(5);
  };

  const timelineIcons = [Clock, Check, Truck, Package];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">{t('orders.title')}</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('buying')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'buying' ? 'bg-primary-500 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-100'}`}
        >
          {t('orders.buying')}
        </button>
        <button
          onClick={() => setTab('selling')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'selling' ? 'bg-primary-500 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-100'}`}
        >
          {t('orders.selling')}
        </button>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-neutral-200 rounded-2xl" />)}
        </div>
      ) : orders && orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => {
            const other = tab === 'buying' ? order.seller : order.buyer;
            const currentStep = orderTimeline.indexOf(order.status as any);
            const isCancelled = order.status === 'cancelled';
            return (
              <div key={order.id} className="bg-white rounded-2xl shadow-card p-5">
                <div className="flex items-start gap-4">
                  {order.product && (
                    <div className="w-16 h-16 rounded-xl bg-neutral-100 overflow-hidden shrink-0">
                      {/* Product thumbnail would go here */}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-neutral-900">{order.product?.title ?? 'Product'}</p>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${orderStatusColors[order.status as keyof typeof orderStatusColors] ?? 'bg-neutral-200'}`}>
                        {t(`orderStatus.${order.status}` as any)}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-500">{other?.full_name} • {formatDate(order.created_at)}</p>
                    <p className="text-sm font-semibold text-neutral-900 mt-1">{formatPrice(order.total_amount)}</p>
                  </div>
                </div>

                {/* Timeline */}
                {!isCancelled && order.status !== 'cancelled' && (
                  <div className="flex items-center mt-4 pt-4 border-t border-neutral-100">
                    {orderTimeline.map((status, i) => {
                      const Icon = timelineIcons[i];
                      const done = i <= currentStep;
                      return (
                        <div key={status} className="flex items-center flex-1 last:flex-none">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${done ? 'bg-primary-500 text-white' : 'bg-neutral-200 text-neutral-400'}`}>
                            <Icon size={16} />
                          </div>
                          {i < orderTimeline.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-1 ${i < currentStep ? 'bg-primary-500' : 'bg-neutral-200'}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  {tab === 'buying' && order.status === 'pending' && (
                    <Button variant="outline" size="sm" onClick={() => updateStatus.mutate({ id: order.id, status: 'cancelled' })}>
                      {t('orders.cancel')}
                    </Button>
                  )}
                  {tab === 'selling' && order.status === 'pending' && (
                    <Button size="sm" onClick={() => updateStatus.mutate({ id: order.id, status: 'confirmed' })}>
                      {t('orders.confirm')}
                    </Button>
                  )}
                  {tab === 'selling' && order.status === 'confirmed' && (
                    <Button size="sm" onClick={() => updateStatus.mutate({ id: order.id, status: 'shipped' })}>
                      {t('orders.ship')}
                    </Button>
                  )}
                  {tab === 'selling' && order.status === 'shipped' && (
                    <Button size="sm" onClick={() => updateStatus.mutate({ id: order.id, status: 'delivered' })}>
                      {t('orders.deliver')}
                    </Button>
                  )}
                  {tab === 'buying' && order.status === 'delivered' && (
                    <Button size="sm" onClick={() => setReviewingOrder(order)}>
                      {t('orders.review')}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={<Package size={48} />} title={t('orders.empty')} />
      )}

      {/* Review modal */}
      <Modal open={!!reviewingOrder} onClose={() => setReviewingOrder(null)} title={t('reviews.title')}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">{t('reviews.rating')}</label>
            <StarRating rating={rating} size={28} interactive showCount={false} onChange={setRating} />
          </div>
          <Textarea
            label={t('reviews.comment')}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder="Share your experience..."
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setReviewingOrder(null)}>{t('common.cancel')}</Button>
            <Button onClick={submitReview}>{t('reviews.submit')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
