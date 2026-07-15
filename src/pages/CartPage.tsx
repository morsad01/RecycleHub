import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Heart, ArrowRight, ShoppingBag, Plus, Minus, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { formatPrice } from '../lib/utils';

export function CartPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch cart items
  const { data: cartItems, isLoading } = useQuery({
    queryKey: ['cart-items'],
    queryFn: async () => {
      const { data } = await supabase
        .from('cart_items')
        .select('*, product:products(*, product_images(*))')
        .eq('user_id', user!.id);
      return data ?? [];
    },
    enabled: !!user,
  });

  // Quantity updates
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      await supabase.from('cart_items').update({ quantity }).eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-items'] });
    },
  });

  // Delete item
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('cart_items').delete().eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-items'] });
      toast('Item removed from cart', 'success');
    },
  });

  // Save for later (Move to Wishlist)
  const moveToWishlistMutation = useMutation({
    mutationFn: async ({ cartItemId, productId }: { cartItemId: string; productId: string }) => {
      // 1. Insert to wishlists
      await supabase.from('wishlists').insert({ user_id: user!.id, product_id: productId });
      // 2. Delete from cart
      await supabase.from('cart_items').delete().eq('id', cartItemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-items'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast('Moved item to wishlist', 'success');
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse space-y-4">
        <div className="h-8 bg-neutral-200 w-48 rounded-lg" />
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-64 bg-neutral-200 rounded-2xl" />
          <div className="h-48 bg-neutral-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  const items = cartItems ?? [];
  const subtotal = items.reduce((sum, item) => sum + (item.product?.price ?? 0) * item.quantity, 0);
  const shippingFee = items.length > 0 ? 120 : 0; // Standard shipping
  const estimatedTax = subtotal * 0.05; // 5% VAT
  const totalAmount = subtotal + shippingFee + estimatedTax;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-black text-neutral-900 mb-6 flex items-center gap-2">
        <ShoppingBag size={24} className="text-primary-500" />
        Shopping Cart
      </h1>

      {items.length > 0 ? (
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Items List */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const prod = item.product;
              if (!prod) return null;
              const img = prod.product_images?.[0]?.url;
              return (
                <div key={item.id} className="bg-white border border-neutral-100 rounded-3xl p-4 flex flex-col sm:flex-row gap-4 shadow-sm relative hover:shadow-md transition-shadow">
                  {/* Image */}
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-neutral-50 shrink-0 self-center sm:self-auto">
                    {img ? (
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-300">
                        <ShoppingBag size={24} />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <Link to={`/products/${prod.id}`} className="font-bold text-neutral-900 hover:text-primary-600 line-clamp-1 text-sm sm:text-base">
                          {prod.title}
                        </Link>
                        <p className="text-2xs text-neutral-400 mt-0.5">Condition: <span className="capitalize font-semibold text-neutral-600">{prod.condition}</span></p>
                      </div>
                      <span className="font-black text-sm sm:text-base text-neutral-900">{formatPrice(prod.price)}</span>
                    </div>

                    {/* Actions panel */}
                    <div className="flex flex-wrap items-center justify-between mt-4 gap-2 pt-2 border-t border-neutral-50">
                      {/* Quantity selector */}
                      <div className="flex items-center gap-2.5 bg-neutral-50 px-2 py-1 rounded-xl">
                        <button
                          onClick={() => {
                            if (item.quantity > 1) {
                              updateQuantityMutation.mutate({ id: item.id, quantity: item.quantity - 1 });
                            }
                          }}
                          disabled={item.quantity <= 1}
                          className="p-1 rounded-lg hover:bg-neutral-200 text-neutral-500 disabled:opacity-30 transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-xs font-bold text-neutral-800 w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => {
                            updateQuantityMutation.mutate({ id: item.id, quantity: item.quantity + 1 });
                          }}
                          className="p-1 rounded-lg hover:bg-neutral-200 text-neutral-500 transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      {/* Wishlist and delete */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveToWishlistMutation.mutate({ cartItemId: item.id, productId: prod.id })}
                          className="text-neutral-400 hover:text-error-500"
                        >
                          <Heart size={14} className="mr-1" /> Move to Wishlist
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteItemMutation.mutate(item.id)}
                          className="text-neutral-400 hover:text-error-500"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cart Summary Card */}
          <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-neutral-900 text-base">Cart Summary</h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-neutral-500">
                <span>Subtotal ({items.length} items)</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Estimated Delivery</span>
                <span>{formatPrice(shippingFee)}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Estimated VAT (5%)</span>
                <span>{formatPrice(estimatedTax)}</span>
              </div>
              <div className="border-t border-neutral-100 pt-2 flex justify-between font-bold text-sm text-neutral-900">
                <span>Total Amount</span>
                <span className="text-primary-600">{formatPrice(totalAmount)}</span>
              </div>
            </div>

            {/* Coupon placeholder */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" size={14} />
                <input
                  type="text"
                  placeholder="Coupon Code"
                  className="w-full text-xs rounded-xl border border-neutral-200 bg-neutral-50 pl-8 pr-2 py-2 focus:outline-none"
                />
              </div>
              <Button size="sm" variant="outline">Apply</Button>
            </div>

            <Button onClick={() => navigate('/checkout')} className="w-full" size="lg">
              Proceed to Checkout <ArrowRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<ShoppingBag size={48} />}
          title="Your cart is empty"
          description="Looks like you haven't added anything to your cart yet."
          action={<Link to="/products"><Button>Start Browsing</Button></Link>}
        />
      )}
    </div>
  );
}
