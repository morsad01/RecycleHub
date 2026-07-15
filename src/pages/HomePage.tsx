import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search, Leaf, Camera, MessageCircle, Package, Sparkles,
  ArrowRight, Shield, Recycle, Smartphone, UserCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { ProductCard } from '../components/ProductCard';
import { SEO } from '../components/SEO';
import { ProductGridSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Avatar } from '../components/ui/Avatar';
import { StarRating } from '../components/ui/StarRating';

import type { ProductWithRelations, Category, Profile } from '../types';
import * as LucideIcons from 'lucide-react';

export function HomePage() {
  const { t } = useI18n();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'featured' | 'latest' | 'trending' | 'recommended' | 'nearby' | 'recent'>('featured');

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*').order('name');
      return (data ?? []) as Category[];
    },
    staleTime: 60_000,
  });

  const recentlyViewedIds: string[] = (() => {
    try {
      return JSON.parse(localStorage.getItem('recently_viewed') ?? '[]');
    } catch {
      return [];
    }
  })();

  const { data: products, isLoading } = useQuery({
    queryKey: ['homepage-products', activeTab, profile?.city, recentlyViewedIds],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*, seller:profiles(*), category:categories(*), product_images(*)')
        .eq('status', 'active');

      if (activeTab === 'featured') {
        query = query.order('views_count', { ascending: false });
      } else if (activeTab === 'latest') {
        query = query.order('created_at', { ascending: false });
      } else if (activeTab === 'trending') {
        query = query.gte('views_count', 1).order('views_count', { ascending: false });
      } else if (activeTab === 'recommended') {
        query = query.order('created_at', { ascending: false });
      } else if (activeTab === 'nearby') {
        if (profile?.city) {
          query = query.ilike('location', `%${profile.city}%`);
        }
        query = query.order('created_at', { ascending: false });
      } else if (activeTab === 'recent') {
        if (recentlyViewedIds.length === 0) return [];
        query = query.in('id', recentlyViewedIds);
      }

      const { data } = await query.limit(8);
      return (data ?? []) as ProductWithRelations[];
    },
    staleTime: 10_000,
  });

  const { data: verifiedSellers } = useQuery({
    queryKey: ['verified-sellers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_seller_verified', true)
        .limit(8);
      return (data ?? []) as Profile[];
    },
    staleTime: 60_000,
  });

  const { data: popularBrands } = useQuery({
    queryKey: ['popular-brands'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('brand')
        .not('brand', 'is', null)
        .limit(100);
      const brandsSet = new Set((data ?? []).map((p) => p.brand).filter(Boolean));
      return Array.from(brandsSet).slice(0, 10);
    },
    staleTime: 60_000,
  });

  const topCategories = categories?.slice(0, 8) ?? [];

  const tabItems: { id: 'featured' | 'latest' | 'trending' | 'recommended' | 'nearby' | 'recent'; label: string; disabled?: boolean }[] = [
    { id: 'featured', label: t('home.featured') },
    { id: 'latest', label: t('home.latest') },
    { id: 'trending', label: t('home.trending') },
    { id: 'recommended', label: t('home.recommended') },
    { id: 'nearby', label: t('home.nearby') },
    { id: 'recent', label: t('home.recentlyViewed'), disabled: recentlyViewedIds.length === 0 },
  ];

  return (
    <div>
      <SEO
        title="Home"
        description="RecycleHub — AI-Powered Smart Resale Marketplace. Buy and sell pre-loved items with AI pricing, condition assessment, and verified sellers."
      />
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary-500 to-primary-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-accent-400/30 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-sm mb-6">
              <Sparkles size={14} />
              <span>AI-Powered Resale Marketplace</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold font-display leading-tight mb-4">
              {t('home.heroTitle')}
            </h1>
            <p className="text-lg text-white/80 mb-8 max-w-xl">
              {t('home.heroSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/sell/new" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-primary-700 rounded-xl font-semibold hover:bg-neutral-50 transition-colors">
                <Package size={20} /> {t('home.heroCta')}
              </Link>
              <Link to="/products" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/20 transition-colors border border-white/20">
                <Search size={20} /> {t('home.heroBrowse')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-neutral-900">{t('home.categories')}</h2>
          <Link to="/products" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
            {t('home.viewAll')} <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {topCategories.map((cat) => {
            const Icon = cat.icon ? (LucideIcons as any)[cat.icon] ?? Smartphone : Smartphone;
            return (
              <Link
                key={cat.id}
                to={`/products?category=${cat.slug}`}
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                  <Icon size={24} className="text-primary-600" />
                </div>
                <span className="text-xs font-medium text-neutral-700 text-center line-clamp-2">{cat.name}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Tabbed Product Lists */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="border-b border-neutral-200 mb-6 overflow-x-auto scrollbar-hide">
          <div className="flex gap-6 min-w-max">
            {tabItems.map((tab) => {
              if (tab.disabled) return null;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-4 text-sm font-semibold border-b-2 transition-all ${
                    active
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <ProductGridSkeleton count={8} />
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Package size={48} />}
            title={t('product.noResults')}
            description={t('product.noResultsDesc')}
          />
        )}
      </section>

      {/* Verified Sellers */}
      {verifiedSellers && verifiedSellers.length > 0 && (
        <section className="bg-neutral-50 py-12 border-y border-neutral-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <UserCheck size={20} className="text-primary-600" />
                <h2 className="text-xl font-bold text-neutral-900">{t('home.verifiedSellers')}</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {verifiedSellers.map((seller) => (
                <Link
                  key={seller.id}
                  to={`/products?seller=${seller.id}`}
                  className="bg-white rounded-2xl p-4 shadow-card hover:shadow-card-hover transition-all flex flex-col items-center text-center"
                >
                  <Avatar src={seller.avatar_url} name={seller.full_name} size={64} />
                  <div className="flex items-center gap-1 mt-3">
                    <span className="font-semibold text-neutral-900 text-sm">{seller.full_name}</span>
                    <Shield size={14} className="text-success-500 shrink-0" />
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">{seller.city ?? 'Bangladesh'}</p>
                  <div className="mt-2">
                    <StarRating rating={seller.rating_avg} count={seller.rating_count} size={12} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Popular Brands */}
      {popularBrands && popularBrands.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <h2 className="text-xl font-bold text-neutral-900 mb-6">{t('home.popularBrands')}</h2>
          <div className="flex flex-wrap gap-3">
            {popularBrands.map((brand) => (
              <Link
                key={brand}
                to={`/products?brand=${encodeURIComponent(brand)}`}
                className="px-4 py-2 bg-white rounded-xl shadow-sm border border-neutral-100 hover:border-primary-500 hover:text-primary-600 transition-all font-medium text-sm text-neutral-700"
              >
                {brand}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-neutral-900 text-center mb-12">{t('home.howItWorks')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Camera size={28} />, title: t('home.step1Title'), desc: t('home.step1Desc') },
              { icon: <MessageCircle size={28} />, title: t('home.step2Title'), desc: t('home.step2Desc') },
              { icon: <Package size={28} />, title: t('home.step3Title'), desc: t('home.step3Desc') },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex w-16 h-16 rounded-2xl bg-primary-50 items-center justify-center text-primary-600 mb-4">
                  {step.icon}
                </div>
                <div className="text-sm font-bold text-accent-500 mb-2">Step {i + 1}</div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">{step.title}</h3>
                <p className="text-sm text-neutral-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sustainability Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="relative bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-3xl p-8 sm:p-12 overflow-hidden">
          <div className="absolute top-0 right-0 opacity-5">
            <Recycle size={200} />
          </div>
          <div className="relative max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/20 text-primary-300 text-sm mb-4">
              <Leaf size={14} /> Sustainability
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">{t('home.sustainabilityTitle')}</h2>
            <p className="text-neutral-300 mb-6">{t('home.sustainabilityDesc')}</p>
            <div className="flex flex-wrap gap-6">
              <div>
                <div className="text-3xl font-bold text-primary-400">10k+</div>
                <div className="text-sm text-neutral-400">Items Resold</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-accent-400">500+</div>
                <div className="text-sm text-neutral-400">Verified Sellers</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary-400">2.5t</div>
                <div className="text-sm text-neutral-400">Waste Reduced</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="bg-white py-12 border-t border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { icon: <Sparkles size={24} />, title: 'AI-Powered', desc: 'Smart pricing & condition checks' },
              { icon: <Shield size={24} />, title: 'Verified Sellers', desc: 'Trust badges for safe buying' },
              { icon: <MessageCircle size={24} />, title: 'Secure Chat', desc: 'In-app messaging with buyers' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900">{item.title}</h3>
                  <p className="text-sm text-neutral-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
