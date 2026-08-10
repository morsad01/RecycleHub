import { Link, useNavigate } from 'react-router-dom';
import { Heart, MapPin, Sparkles, Shield, ShoppingCart } from 'lucide-react';
import type { ProductWithRelations } from '../types';
import { formatPrice, conditionColors, toDirectGoogleDriveUrl } from '../lib/utils';
import { Badge } from './ui/Badge';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useToast } from './ui/Toast';

export function ProductCard({ product }: { product: ProductWithRelations }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const navigate = useNavigate();
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

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        navigate(`/login?redirect=/products/${product.id}`);
        return;
      }
      if (user.id === product.seller_id) {
        toast('You cannot add your own product to cart', 'info');
        return;
      }
      const { data: existing } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('cart_items')
          .update({ quantity: existing.quantity + 1 })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('cart_items')
          .insert({ user_id: user.id, product_id: product.id, quantity: 1 });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-items'] });
      queryClient.invalidateQueries({ queryKey: ['cart-count'] });
      toast('Added to cart! 🛒', 'success');
    },
  });

  const primaryImage = product.product_images?.find((img) => img.is_primary) ?? product.product_images?.[0];
  const conditionKey = product.condition ? `condition.${product.condition}` : null;
  const imageUrl = toDirectGoogleDriveUrl(primaryImage?.url);

  return (
    <Link to={`/products/${product.id}`} className="group block">
      <div className="bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-200 overflow-hidden flex flex-col h-full">
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
              aria-label="Wishlist"
            >
              <Heart size={16} className={isWishlisted ? 'fill-error-500 text-error-500' : 'text-neutral-400'} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-3 flex flex-col flex-1 justify-between">
          <div>
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
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-neutral-100">
            <span className="text-base font-bold text-neutral-900">{formatPrice(product.price)}</span>
            
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addToCartMutation.mutate();
              }}
              className="p-2 rounded-xl bg-primary-50 text-primary-700 hover:bg-primary-600 hover:text-white transition-all shadow-xs"
              title="Add to Cart"
              aria-label="Add to Cart"
            >
              <ShoppingCart size={15} />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
