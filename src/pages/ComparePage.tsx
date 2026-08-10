import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Sparkles, Check, ArrowRight, ShieldCheck,
  TrendingDown, ShoppingCart, MessageCircle, X, Plus
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SEO } from '../components/SEO';
import { Button, Badge, Avatar } from '../components/ui';
import { formatPrice } from '../lib/utils';
import { VerifiedIdentityBadge } from '../components/trust/VerifiedIdentityBadge';
import { TrustScoreCard } from '../components/trust/TrustScoreCard';
import { DealScoreBadge } from '../components/trust/DealScoreBadge';
import type { ProductWithRelations } from '../types';

export function ComparePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawIds = searchParams.get('ids') || '';
  const productIds = rawIds.split(',').filter(Boolean);

  // Fetch products to compare
  const { data: products, isLoading } = useQuery({
    queryKey: ['compare-products', productIds],
    queryFn: async () => {
      if (productIds.length === 0) {
        // Fallback to fetch latest active products for demonstration
        const { data } = await supabase
          .from('products')
          .select('*, seller:profiles(*), category:categories(*), product_images(*)')
          .eq('status', 'active')
          .limit(3);
        return (data ?? []) as ProductWithRelations[];
      }
      const { data } = await supabase
        .from('products')
        .select('*, seller:profiles(*), category:categories(*), product_images(*)')
        .in('id', productIds);
      return (data ?? []) as ProductWithRelations[];
    },
  });

  const removeProduct = (id: string) => {
    const next = productIds.filter((p) => p !== id);
    setSearchParams(next.length > 0 ? { ids: next.join(',') } : {});
  };

  const getBestValueId = () => {
    if (!products || products.length === 0) return null;
    return products.slice().sort((a, b) => a.price - b.price)[0]?.id;
  };

  const bestValueId = getBestValueId();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <SEO
        title="AI Product Comparison"
        description="Compare pre-loved products side-by-side on ResellBD. Compare price intelligence, seller trust scores, deal scores, and condition reports."
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold mb-2">
            <Sparkles size={14} /> AI Product Intelligence
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 font-display">Side-by-Side Comparison</h1>
          <p className="text-xs text-neutral-500 mt-1">
            Compare prices, seller trust scores, AI visual condition assessments, and potential savings.
          </p>
        </div>

        <Link to="/products">
          <Button variant="outline" size="sm">
            <Plus size={14} className="mr-1" /> Add More Products
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 bg-white rounded-3xl" />
          ))}
        </div>
      ) : products && products.length > 0 ? (
        <div className="space-y-8">
          {/* Comparison Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => {
              const isBest = p.id === bestValueId;
              const img = p.product_images?.[0]?.url;

              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-3xl p-6 shadow-card border relative flex flex-col justify-between transition-all ${
                    isBest ? 'border-primary-500 ring-2 ring-primary-500/10' : 'border-neutral-100'
                  }`}
                >
                  {/* Remove Button */}
                  <button
                    onClick={() => removeProduct(p.id)}
                    className="absolute top-3 right-3 w-7 h-7 rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 flex items-center justify-center transition-colors z-10"
                    title="Remove from comparison"
                  >
                    <X size={14} />
                  </button>

                  <div className="space-y-4">
                    {/* Image & Best Tag */}
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-neutral-100">
                      {img ? (
                        <img src={img} alt={p.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-300">
                          No Image
                        </div>
                      )}
                      {isBest && (
                        <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full bg-primary-600 text-white text-3xs font-bold shadow-sm flex items-center gap-1">
                          <Sparkles size={10} /> Best Value Choice
                        </div>
                      )}
                    </div>

                    {/* Title & Category */}
                    <div>
                      <span className="text-2xs font-semibold text-neutral-400 uppercase tracking-wide">
                        {p.category?.name || 'Category'}
                      </span>
                      <h3 className="font-bold text-neutral-900 text-sm line-clamp-1 mt-0.5">{p.title}</h3>
                      <p className="text-xl font-black text-neutral-900 mt-2">{formatPrice(p.price)}</p>
                    </div>

                    {/* Deal Score & Trust Badges */}
                    <div className="space-y-2 pt-2 border-t border-neutral-100">
                      <div>
                        <span className="text-3xs text-neutral-400 font-semibold block mb-1">Deal Rating</span>
                        <DealScoreBadge price={p.price} condition={p.condition} brand={p.brand} size="sm" />
                      </div>

                      <div>
                        <span className="text-3xs text-neutral-400 font-semibold block mb-1">Seller Trust</span>
                        <div className="flex items-center gap-2">
                          <VerifiedIdentityBadge
                            level="level_3"
                            isSellerVerified={p.seller?.is_seller_verified}
                            size="sm"
                          />
                          <TrustScoreCard profile={p.seller} compact />
                        </div>
                      </div>
                    </div>

                    {/* Condition & Specs */}
                    <div className="p-3.5 rounded-2xl bg-neutral-50 space-y-2 text-2xs">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Visual Condition:</span>
                        <span className="font-bold capitalize text-neutral-800">{p.condition || 'Good'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Brand:</span>
                        <span className="font-bold text-neutral-800">{p.brand || 'Authentic'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Location:</span>
                        <span className="font-bold text-neutral-800">{p.location || 'Bangladesh'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 mt-4 border-t border-neutral-100 flex gap-2">
                    <Link to={`/products/${p.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        View Item
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center text-neutral-400 shadow-card border border-neutral-100 space-y-3">
          <Sparkles size={40} className="mx-auto text-primary-400" />
          <h3 className="font-bold text-neutral-800 text-base">No Products Selected to Compare</h3>
          <p className="text-xs max-w-sm mx-auto">
            Add 2 to 4 listings from the marketplace to evaluate side-by-side price intelligence and seller reliability.
          </p>
          <Link to="/products" className="inline-block pt-2">
            <Button size="sm">Browse Listings</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
