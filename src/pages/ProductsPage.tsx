import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal, X, Search, ShieldCheck, Sparkles, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useI18n } from '../i18n/I18nContext';
import { ProductCard } from '../components/ProductCard';
import { SEO } from '../components/SEO';
import { ProductGridSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui';
import type { ProductWithRelations, Category } from '../types';

export function ProductsPage() {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Search suggestions overlay state
  const [searchFocused, setSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const q = searchParams.get('q') ?? '';
  const categorySlug = searchParams.get('category') ?? '';
  const subcategorySlug = searchParams.get('subcategory') ?? '';
  const brand = searchParams.get('brand') ?? '';
  const sort = searchParams.get('sort') ?? 'newest';
  const minPrice = searchParams.get('minPrice') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';
  const condition = searchParams.get('condition') ?? '';
  const verifiedSellerOnly = searchParams.get('verified') === 'true';
  const inStockOnly = searchParams.get('inStock') === 'true';
  const sellerId = searchParams.get('seller') ?? '';

  // Load categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*').order('name');
      return (data ?? []) as Category[];
    },
    staleTime: 60_000,
  });

  // Load search history on mount
  useEffect(() => {
    try {
      const history = JSON.parse(localStorage.getItem('recent_searches') ?? '[]');
      setRecentSearches(history);
    } catch {}
  }, []);

  // Handle outside click to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch unique brands
  const { data: uniqueBrands } = useQuery({
    queryKey: ['unique-brands'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('brand')
        .not('brand', 'is', null);
      return Array.from(new Set((data ?? []).map((p) => p.brand).filter(Boolean))) as string[];
    },
    staleTime: 60_000,
  });

  // Fetch search suggestions
  const { data: suggestions } = useQuery({
    queryKey: ['search-suggestions', q],
    queryFn: async () => {
      if (!q.trim()) return [];
      const { data } = await supabase
        .from('products')
        .select('title')
        .eq('status', 'active')
        .ilike('title', `%${q}%`)
        .limit(5);
      return Array.from(new Set((data ?? []).map((p) => p.title)));
    },
    enabled: q.trim().length > 1,
  });

  // Main Products Query
  const { data: productsData, isLoading } = useQuery({
    queryKey: [
      'products', q, categorySlug, subcategorySlug, brand, sort,
      minPrice, maxPrice, condition, verifiedSellerOnly, inStockOnly, sellerId, page
    ],
    queryFn: async () => {
      let selectStr = '*, seller:profiles!inner(*), category:categories(*), product_images(*)';
      
      // If we need verified sellers, we use Postgrest inner join filtering
      if (verifiedSellerOnly) {
        selectStr = '*, seller:profiles!inner(*), category:categories(*), product_images(*)';
      }

      let query = supabase
        .from('products')
        .select(selectStr)
        .eq('status', 'active');

      if (verifiedSellerOnly) {
        query = query.eq('seller.is_seller_verified', true);
      }

      if (inStockOnly) {
        query = query.eq('stock_status', 'in_stock');
      }

      if (sellerId) {
        query = query.eq('seller_id', sellerId);
      }

      if (q) {
        query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
      }

      if (brand) {
        query = query.eq('brand', brand);
      }

      // Handle category & subcategory filters
      if (subcategorySlug) {
        const sub = categories?.find((c) => c.slug === subcategorySlug);
        if (sub) query = query.eq('category_id', sub.id);
      } else if (categorySlug) {
        const cat = categories?.find((c) => c.slug === categorySlug);
        if (cat) {
          // Find all subcategories that list this category as parent
          const childIds = categories?.filter((c) => c.parent_id === cat.id).map((c) => c.id) ?? [];
          const categoryIds = [cat.id, ...childIds];
          query = query.in('category_id', categoryIds);
        }
      }

      if (minPrice) query = query.gte('price', parseFloat(minPrice));
      if (maxPrice) query = query.lte('price', parseFloat(maxPrice));
      if (condition) query = query.eq('condition', condition);

      // Handle Sorting modes
      switch (sort) {
        case 'priceLow':
          query = query.order('price', { ascending: true });
          break;
        case 'priceHigh':
          query = query.order('price', { ascending: false });
          break;
        case 'popular':
        case 'mostViewed':
          query = query.order('views_count', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      // Log searches to Supabase search_logs if search term is active and first page is loaded
      if (q && page === 1) {
        supabase
          .from('search_logs')
          .insert({ query: q, results_count: 0 })
          .then();
      }

      // Load specific slice size
      const { data } = await query.range(0, (pageSize * page) - 1);
      return (data ?? []) as any as ProductWithRelations[];
    },
    enabled: !!categories,
  });

  const updateParam = (key: string, value: string) => {
    setPage(1); // Reset page on filter change
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const clearFilters = () => {
    setPage(1);
    setSearchParams(new URLSearchParams());
  };

  const saveSearchTerm = (term: string) => {
    if (!term.trim()) return;
    const history = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 5);
    setRecentSearches(history);
    localStorage.setItem('recent_searches', JSON.stringify(history));
  };

  const deleteSearchTerm = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const history = recentSearches.filter((s) => s !== term);
    setRecentSearches(history);
    localStorage.setItem('recent_searches', JSON.stringify(history));
  };

  const selectSuggestion = (term: string) => {
    updateParam('q', term);
    saveSearchTerm(term);
    setSearchFocused(false);
  };

  // Highlights matched search terms
  const renderHighlighted = (text: string, query: string) => {
    if (!query) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-primary-100 text-primary-800 font-semibold rounded px-0.5">{part}</mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const hasFilters = q || categorySlug || subcategorySlug || brand || minPrice || maxPrice || condition || verifiedSellerOnly || inStockOnly;

  // Derive parent categories & child subcategories
  const parentCategories = categories?.filter((c) => !c.parent_id) ?? [];
  const activeCategory = categories?.find((c) => c.slug === categorySlug);
  const subcategories = categories?.filter((c) => c.parent_id && c.parent_id === activeCategory?.id) ?? [];

  const handleSearchSubmit = (term: string) => {
    updateParam('q', term);
    saveSearchTerm(term);
    setSearchFocused(false);
  };

  const hasMore = productsData && productsData.length >= pageSize * page;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <SEO
        title={q ? `Search: ${q}` : 'Marketplace'}
        description={`Browse ${q ? `"${q}" in` : ''} RecycleHub marketplace. Discover thousands of pre-loved items from verified sellers.`}
      />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">
          {categorySlug
            ? categories?.find((c) => c.slug === categorySlug)?.name ?? 'Browse'
            : q ? `"${q}"` : t('nav.browse')}
        </h1>
        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="lg:hidden">
          <SlidersHorizontal size={16} /> {t('common.filter')}
        </Button>
      </div>

      <div className="flex gap-6">
        {/* Filters sidebar */}
        <aside className={`${showFilters ? 'fixed inset-0 z-40 bg-black/20 lg:bg-transparent lg:static lg:z-auto' : 'hidden'} lg:block w-full lg:w-64 shrink-0`}>
          <div className={`${showFilters ? 'absolute bottom-0 left-0 right-0 top-0 lg:static lg:rounded-2xl' : ''} bg-white lg:shadow-card p-4 lg:p-5 space-y-5 overflow-y-auto`}>
            <div className="flex items-center justify-between lg:hidden">
              <h2 className="font-semibold">{t('common.filter')}</h2>
              <button onClick={() => setShowFilters(false)}><X size={20} /></button>
            </div>

            {/* Search Input Container */}
            <div ref={searchContainerRef} className="relative">
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t('common.search')}</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={q}
                  onFocus={() => setSearchFocused(true)}
                  onChange={(e) => updateParam('q', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit((e.target as HTMLInputElement).value)}
                  placeholder={t('nav.search')}
                  className="w-full rounded-xl border border-neutral-300 pl-9 pr-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                />
              </div>

              {/* Suggestions Overlay */}
              {searchFocused && (
                <div className="absolute left-0 right-0 mt-1 bg-white rounded-2xl shadow-card border border-neutral-100 z-50 overflow-hidden max-h-80 overflow-y-auto">
                  {recentSearches.length > 0 && (
                    <div className="p-3 border-b border-neutral-50">
                      <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Clock size={12} /> Recent Searches
                      </p>
                      <div className="space-y-1.5">
                        {recentSearches.map((term) => (
                          <div
                            key={term}
                            onClick={() => selectSuggestion(term)}
                            className="flex items-center justify-between text-sm text-neutral-700 hover:bg-neutral-50 p-2 rounded-xl cursor-pointer"
                          >
                            <span>{term}</span>
                            <button
                              onClick={(e) => deleteSearchTerm(term, e)}
                              className="text-neutral-400 hover:text-error-500 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {suggestions && suggestions.length > 0 && (
                    <div className="p-3 border-b border-neutral-50">
                      <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Search size={12} /> Suggestions
                      </p>
                      <div className="space-y-1">
                        {suggestions.map((term) => (
                          <div
                            key={term}
                            onClick={() => selectSuggestion(term)}
                            className="flex items-center gap-2 text-sm text-neutral-700 hover:bg-neutral-50 p-2 rounded-xl cursor-pointer"
                          >
                            <Search size={14} className="text-neutral-400 shrink-0" />
                            <span>{renderHighlighted(term, q)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-3">
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Sparkles size={12} /> Popular Searches
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {['iPhone', 'Bicycle', 'Sofa', 'Laptop', 'Books'].map((term) => (
                        <button
                          key={term}
                          onClick={() => selectSuggestion(term)}
                          className="text-xs bg-neutral-50 hover:bg-primary-50 hover:text-primary-600 border border-neutral-200 hover:border-primary-300 px-2.5 py-1.5 rounded-full transition-all text-neutral-600 font-medium"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t('sell.category')}</label>
              <select
                value={categorySlug}
                onChange={(e) => {
                  updateParam('category', e.target.value);
                  updateParam('subcategory', ''); // Reset subcategory when category changes
                }}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              >
                <option value="">{t('common.all')}</option>
                {parentCategories.map((c) => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Subcategory Filter (if parent category is selected) */}
            {categorySlug && subcategories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Subcategory</label>
                <select
                  value={subcategorySlug}
                  onChange={(e) => updateParam('subcategory', e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                >
                  <option value="">{t('common.all')}</option>
                  {subcategories.map((sub) => (
                    <option key={sub.id} value={sub.slug}>{sub.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Brand Filter */}
            {uniqueBrands && uniqueBrands.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Brand</label>
                <select
                  value={brand}
                  onChange={(e) => updateParam('brand', e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                >
                  <option value="">{t('common.all')}</option>
                  {uniqueBrands.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Condition Filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t('product.condition')}</label>
              <select
                value={condition}
                onChange={(e) => updateParam('condition', e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              >
                <option value="">{t('common.all')}</option>
                <option value="new">{t('condition.new')}</option>
                <option value="excellent">{t('condition.excellent')}</option>
                <option value="good">{t('condition.good')}</option>
                <option value="fair">{t('condition.fair')}</option>
                <option value="poor">{t('condition.poor')}</option>
              </select>
            </div>

            {/* Price range */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t('common.priceRange')}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => updateParam('minPrice', e.target.value)}
                  placeholder={t('common.min')}
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                />
                <span className="text-neutral-400">-</span>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => updateParam('maxPrice', e.target.value)}
                  placeholder={t('common.max')}
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                />
              </div>
            </div>

            {/* Verified Seller Toggles */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={verifiedSellerOnly}
                  onChange={(e) => updateParam('verified', e.target.checked ? 'true' : '')}
                  className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700 flex items-center gap-1">
                  <ShieldCheck size={16} className="text-primary-500" /> Verified Sellers Only
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => updateParam('inStock', e.target.checked ? 'true' : '')}
                  className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700">In Stock Only</span>
              </label>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t('product.sortBy')}</label>
              <select
                value={sort}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              >
                <option value="newest">{t('sort.newest')}</option>
                <option value="oldest">{t('sort.oldest')}</option>
                <option value="priceLow">{t('sort.priceLow')}</option>
                <option value="priceHigh">{t('sort.priceHigh')}</option>
                <option value="mostViewed">{t('sort.mostViewed')}</option>
              </select>
            </div>

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full">
                {t('common.clear')} {t('common.filter')}
              </Button>
            )}
          </div>
        </aside>

        {/* Products grid */}
        <div className="flex-1">
          {isLoading ? (
            <ProductGridSkeleton count={8} />
          ) : productsData && productsData.length > 0 ? (
            <div className="space-y-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {productsData.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <Button variant="outline" size="lg" onClick={() => setPage((p) => p + 1)}>
                    Load More
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              icon={<Search size={48} />}
              title={t('product.noResults')}
              description={t('product.noResultsDesc')}
            />
          )}
        </div>
      </div>
    </div>
  );
}
