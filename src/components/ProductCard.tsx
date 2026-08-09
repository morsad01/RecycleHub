import { Link } from 'react-router-dom';
import { Heart, MapPin, Sparkles, Shield } from 'lucide-react';
import type { ProductWithRelations } from '../types';
import { formatPrice, conditionColors, toDirectGoogleDriveUrl } from '../lib/utils';
import { Badge } from './ui/Badge';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function ProductCard({ product }: { product: ProductWithRelations }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const { data: isWishlisted } = useQuery({
    queryKey: ['wishlist-check', product.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from('wishlists')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const toggleWishlist = useMutation({
    mutationFn: async () => {
      if (!user) return;
      if (isWishlisted) {
        await supabase.from('wishlists').delete().eq('user_id', user.id).eq('product_id', product.id);
      } else {
        await supabase.from('wishlists').insert({ user_id: user.id, product_id: product.id });
      }
    },
    onMutate: () => {
      queryClient.setQueryData(['wishlist-check', product.id], !isWishlisted);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  const primaryImage = product.product_images?.find((img) => img.is_primary) ?? product.product_images?.[0];
  const conditionKey = product.condition ? `condition.${product.condition}` : null;
  const imageUrl = toDirectGoogleDriveUrl(primaryImage?.url);

  return (
    <Link to={`/products/${product.id}`} className="group block">
      <div className="bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-200 overflow-hidden">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-300">
              <Sparkles size={32} />
            </div>
          )}
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.ai_category_confidence && (
              <Badge variant="accent" className="shadow-sm">
                <Sparkles size={10} /> {t('product.aiSuggested')}
              </Badge>
            )}
            {conditionKey && (
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${conditionColors[product.condition!] || 'bg-neutral-100 text-neutral-700'} shadow-sm`}>
                {t(conditionKey as any)}
              </span>
            )}
          </div>
          {/* Wishlist button */}
          {user && (
            <button
              onClick={(e) => {
                e.preventDefault();
                toggleWishlist.mutate();
              }}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
            >
              <Heart size={16} className={isWishlisted ? 'fill-error-500 text-error-500' : 'text-neutral-400'} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          <h3 className="text-sm font-medium text-neutral-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {product.title}
          </h3>
          <div className="flex items-center gap-1 mt-1 text-xs text-neutral-500">
            {product.location && (
              <>
                <MapPin size={12} />
                <span className="truncate">{product.location}</span>
              </>
            )}
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-base font-bold text-neutral-900">{formatPrice(product.price)}</span>
            {product.seller?.is_seller_verified && (
              <Shield size={14} className="text-success-500" />
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
