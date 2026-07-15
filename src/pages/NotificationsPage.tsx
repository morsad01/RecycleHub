import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Trash2, Package, MessageCircle, CreditCard, Truck, Star, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { Button } from '../components/ui';
import { EmptyState } from '../components/ui/EmptyState';
import { SEO } from '../components/SEO';
import { timeAgo } from '../lib/utils';
import type { Notification } from '../types';

// Map notification type to icon
function NotifIcon({ type }: { type: string | null }) {
  const cls = 'w-10 h-10 rounded-xl flex items-center justify-center shrink-0';
  if (type === 'order') return <div className={`${cls} bg-blue-100 text-blue-600`}><Package size={18} /></div>;
  if (type === 'message') return <div className={`${cls} bg-primary-100 text-primary-600`}><MessageCircle size={18} /></div>;
  if (type === 'payment') return <div className={`${cls} bg-success-100 text-success-600`}><CreditCard size={18} /></div>;
  if (type === 'shipment') return <div className={`${cls} bg-accent-100 text-accent-600`}><Truck size={18} /></div>;
  if (type === 'review') return <div className={`${cls} bg-yellow-100 text-yellow-600`}><Star size={18} /></div>;
  if (type === 'verification') return <div className={`${cls} bg-success-100 text-success-600`}><ShieldCheck size={18} /></div>;
  return <div className={`${cls} bg-neutral-100 text-neutral-400`}><Bell size={18} /></div>;
}

export function NotificationsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);
      return (data ?? []) as Notification[];
    },
    enabled: !!user,
  });

  // Realtime subscription for live notifications
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const markAllRead = useMutation({
    mutationFn: async () => {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user!.id).eq('is_read', false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
    },
  });

  const deleteNotification = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('notifications').delete().eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
  };

  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0;

  return (
    <>
      <SEO title="Notifications" description="View all your RecycleHub notifications for orders, messages, payments, and more." />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-neutral-900">{t('notifications.title')}</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-primary-500 text-white text-xs font-bold rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllRead.mutate()}
              loading={markAllRead.isPending}
              aria-label="Mark all notifications as read"
            >
              <CheckCheck size={16} /> {t('notifications.markAllRead')}
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-neutral-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : notifications && notifications.length > 0 ? (
          <div className="space-y-2" role="list" aria-label="Notifications">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                role="listitem"
                onClick={() => !notif.is_read && markRead(notif.id)}
                className={`group flex items-start gap-3 p-4 rounded-2xl cursor-pointer transition-all ${
                  notif.is_read
                    ? 'bg-white shadow-card hover:shadow-md'
                    : 'bg-primary-50 border border-primary-100 hover:bg-primary-50/80'
                }`}
              >
                <NotifIcon type={notif.type} />

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${notif.is_read ? 'text-neutral-700' : 'text-neutral-900'}`}>
                    {notif.title}
                  </p>
                  {notif.message && (
                    <p className="text-sm text-neutral-500 mt-0.5 line-clamp-2">{notif.message}</p>
                  )}
                  <p className="text-xs text-neutral-400 mt-1">{timeAgo(notif.created_at)}</p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!notif.is_read && <div className="w-2 h-2 rounded-full bg-primary-500 mt-1" aria-label="Unread" />}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotification.mutate(notif.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-neutral-300 hover:text-error-500 hover:bg-error-50 transition-all"
                    aria-label="Delete notification"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={<Bell size={48} />} title={t('notifications.empty')} description="You're all caught up! No notifications at the moment." />
        )}
      </div>
    </>
  );
}
