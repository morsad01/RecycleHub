import { useQuery } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { ProductCard } from '../components/ProductCard';
import { EmptyState } from '../components/ui/EmptyState';
import type { ProductWithRelations } from '../types';

export function WishlistPage() {
  const { user } = useAuth();
  const { t } = useI18n();

  const { data: products, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const { data } = await supabase
        .from('wishlists')
        .select('product:products(*, seller:profiles(*), category:categories(*), product_images(*))')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      return (data ?? []).map((w: any) => w.product) as ProductWithRelations[];
    },
    enabled: !!user,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">{t('wishlist.title')}</h1>
      {isLoading ? (
        <div className="animate-pulse grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => <div key={i} className="h-64 bg-neutral-200 rounded-2xl" />)}
        </div>
      ) : products && products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Heart size={48} />}
          title={t('wishlist.empty')}
          description={t('wishlist.emptyDesc')}
        />
      )}
    </div>
  );
}
