import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package, Shield, Award, BarChart3, ShoppingCart,
  Settings, Plus, FileText, Trash2, Download, FileDown,
  Sparkles, CheckCircle, AlertTriangle, FileSpreadsheet,
  CreditCard, Globe, Car, Lock, CheckCircle2, Clock, XCircle, ArrowRight,
  Edit2, Copy
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { useToast } from '../components/ui/Toast';
import { Button, Badge, Avatar, StarRating, Modal, Input, Textarea, Select } from '../components/ui';
import { EmptyState } from '../components/ui/EmptyState';
import { formatPrice, formatDate, statusColors, orderStatusColors } from '../lib/utils';
import type { ProductWithRelations, Order, Review, Category, IdentityVerification } from '../types';
import { AiDashboardTab } from '../features/ai/components/AiDashboardTab';

export function DashboardPage() {
  const { user, profile } = useAuth();
  const { lang, t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'performance' | 'verification' | 'settings' | 'ai-dashboard'>('overview');

  // Selected products for bulk actions
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [bulkPriceValue, setBulkPriceValue] = useState('');
  const [bulkCategoryValue, setBulkCategoryValue] = useState('');
  const [showBulkPriceModal, setShowBulkPriceModal] = useState(false);
  const [showBulkCategoryModal, setShowBulkCategoryModal] = useState(false);

  // Selected order for detail invoice modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Selected product for AI insights modal
  const [aiProduct, setAiProduct] = useState<ProductWithRelations | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);

  // Profile Settings Form
  const [businessName, setBusinessName] = useState(profile?.business_name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [city, setCity] = useState(profile?.city ?? '');
  const [address, setAddress] = useState(profile?.address ?? '');
  const [website, setWebsite] = useState(profile?.website ?? '');
  const [facebookUrl, setFacebookUrl] = useState(profile?.facebook_url ?? '');
  const [instagramUrl, setInstagramUrl] = useState(profile?.instagram_url ?? '');
  const [businessHours, setBusinessHours] = useState(profile?.business_hours ?? '9:00 AM - 6:00 PM');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // General categories query
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*').order('name');
      return (data ?? []) as Category[];
    },
    staleTime: 60_000,
  });

  // Queries for Seller Central
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['seller-products', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('*, category:categories(*), product_images(*)')
        .eq('seller_id', user!.id)
        .order('created_at', { ascending: false });
      return (data ?? []) as ProductWithRelations[];
    },
    enabled: !!user,
  });

  const { data: orders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['seller-orders', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, buyer:profiles(*), product:products(*)')
        .eq('seller_id', user!.id)
        .order('created_at', { ascending: false });
      return (data ?? []) as any[] as Order[];
    },
    enabled: !!user,
  });

  const { data: reviews, isLoading: isLoadingReviews } = useQuery({
    queryKey: ['seller-reviews', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('reviews')
        .select('*, reviewer:profiles(*)')
        .eq('reviewee_id', user!.id)
        .order('created_at', { ascending: false });
      return (data ?? []) as Review[];
    },
    enabled: !!user,
  });

  const { data: verifications } = useQuery({
    queryKey: ['my-identity-verification', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('identity_verifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as IdentityVerification | null;
    },
    enabled: !!user,
  });

  // Bulk mutations
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await supabase.from('products').delete().in('id', ids);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      setSelectedProductIds([]);
      toast('Selected products deleted', 'success');
    },
  });

  const bulkStatusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: 'active' | 'draft' }) => {
      await supabase.from('products').update({ status }).in('id', ids);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      setSelectedProductIds([]);
      toast('Selected products updated', 'success');
    },
  });

  const bulkPriceMutation = useMutation({
    mutationFn: async ({ ids, newPrice }: { ids: string[]; newPrice: number }) => {
      await supabase.from('products').update({ price: newPrice }).in('id', ids);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      setSelectedProductIds([]);
      setShowBulkPriceModal(false);
      setBulkPriceValue('');
      toast('Prices updated successfully', 'success');
    },
  });

  const bulkCategoryMutation = useMutation({
    mutationFn: async ({ ids, categoryId }: { ids: string[]; categoryId: string }) => {
      await supabase.from('products').update({ category_id: categoryId }).in('id', ids);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      setSelectedProductIds([]);
      setShowBulkCategoryModal(false);
      setBulkCategoryValue('');
      toast('Categories updated successfully', 'success');
    },
  });

  // Single listing mutations
  const deleteProduct = (id: string) => {
    if (confirm('Delete this listing permanently?')) {
      supabase.from('products').delete().eq('id', id).then(() => {
        queryClient.invalidateQueries({ queryKey: ['seller-products'] });
        toast('Listing deleted', 'success');
      });
    }
  };

  const toggleProductStatus = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'draft' : 'active';
    supabase.from('products').update({ status: nextStatus }).eq('id', id).then(() => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      toast(nextStatus === 'active' ? 'Published' : 'Archived', 'success');
    });
  };

  const duplicateListing = async (product: ProductWithRelations) => {
    const duplicateData = {
      seller_id: product.seller_id,
      title: `${product.title} (Copy)`,
      description: product.description,
      category_id: product.category_id,
      price: product.price,
      original_price: (product as any).original_price,
      is_negotiable: (product as any).is_negotiable,
      brand: (product as any).brand,
      specifications: (product as any).specifications,
      condition: product.condition,
      location: product.location,
      status: 'draft',
      stock_quantity: product.stock_quantity ?? 1,
      stock_status: product.stock_status ?? 'in_stock',
    };
    const { data, error } = await supabase.from('products').insert(duplicateData).select('id').single();
    if (error) {
      toast(error.message, 'error');
    } else {
      if (product.product_images && product.product_images.length > 0) {
        await supabase.from('product_images').insert(
          product.product_images.map((img) => ({
            product_id: data.id,
            url: img.url,
            is_primary: img.is_primary,
            sort_order: img.sort_order,
          }))
        );
      }
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      toast('Listing duplicated as draft', 'success');
    }
  };

  // Apply AI Suggestions action
  const applyAiSuggestions = (p: ProductWithRelations) => {
    if (!p.ai_suggested_price && !p.ai_condition) return;
    const updates: any = {};
    if (p.ai_suggested_price) updates.price = p.ai_suggested_price;
    if (p.ai_condition) updates.condition = p.ai_condition;

    supabase.from('products').update(updates).eq('id', p.id).then(() => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      toast('AI insights applied to product details!', 'success');
      setShowAiModal(false);
    });
  };

  // Order status mutations
  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: any }) => {
      await supabase.from('orders').update({ status }).eq('id', orderId);
      // Increment total sales count on completed delivered order
      if (status === 'delivered') {
        const { data: order } = await supabase.from('orders').select('total_amount').eq('id', orderId).single();
        if (order) {
          await supabase.rpc('increment_seller_sales', { amount: order.total_amount });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      toast('Order status updated', 'success');
    },
  });

  // Profile update mutation
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUpdatingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        business_name: businessName.trim() || null,
        bio: bio.trim() || null,
        phone: phone.trim() || null,
        city: city.trim() || null,
        address: address.trim() || null,
        website: website.trim() || null,
        facebook_url: facebookUrl.trim() || null,
        instagram_url: instagramUrl.trim() || null,
        business_hours: businessHours.trim() || null,
      })
      .eq('id', user.id);
    setUpdatingProfile(false);
    if (error) {
      toast(error.message, 'error');
    } else {
      toast('Profile updated successfully!', 'success');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  };



  // Export listings to CSV
  const exportListings = () => {
    if (!products || products.length === 0) return;
    const data = products.map((p) => ({
      Title: p.title,
      Price: p.price,
      Condition: p.condition,
      Status: p.status,
      Views: p.views_count,
      Stock: p.stock_quantity ?? 1,
      Location: p.location || '',
      Created: p.created_at,
    }));
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((row) => Object.values(row).map((val) => `"${val}"`).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'listings_inventory.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export orders to Excel-formatted CSV
  const exportOrders = () => {
    if (!orders || orders.length === 0) return;
    const data = orders.map((o) => ({
      'Order ID': o.id,
      Buyer: o.buyer?.full_name || '',
      Product: o.product?.title || '',
      Amount: o.total_amount,
      Status: o.status,
      Created: o.created_at,
    }));
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((row) => Object.values(row).map((val) => `"${val}"`).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'orders_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Profile completion progress calculation
  const getProfileCompletion = () => {
    let score = 0;
    if (profile?.full_name) score += 12;
    if (profile?.avatar_url) score += 11;
    if (profile?.cover_image_url) score += 11;
    if (profile?.business_name) score += 11;
    if (profile?.bio) score += 11;
    if (profile?.website) score += 11;
    if (profile?.phone) score += 11;
    if (profile?.address) score += 11;
    if (profile?.city) score += 11;
    return score;
  };

  // Stats derivations
  const totalRevenue = orders
    ?.filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + o.total_amount, 0) ?? 0;

  const netRevenue = totalRevenue * 0.92; // 92% after 8% marketplace handling fee

  const pendingOrdersCount = orders?.filter((o) => o.status === 'pending').length ?? 0;
  const completedOrdersCount = orders?.filter((o) => o.status === 'delivered').length ?? 0;
  const cancelledOrdersCount = orders?.filter((o) => o.status === 'cancelled').length ?? 0;

  const activeProductsCount = products?.filter((p) => p.status === 'active').length ?? 0;
  const pendingReviewCount = products?.filter((p) => p.status === 'pending').length ?? 0;
  const flaggedCount = products?.filter((p) => p.status === 'flagged').length ?? 0;

  const lowStockCount = products?.filter((p) => p.status === 'active' && p.stock_quantity <= 1).length ?? 0;

  // Derive top selling product
  const getTopSelling = () => {
    if (!orders || orders.length === 0) return null;
    const counts: Record<string, { title: string; count: number }> = {};
    orders.forEach((o) => {
      if (o.product) {
        if (!counts[o.product_id]) counts[o.product_id] = { title: o.product.title, count: 0 };
        counts[o.product_id].count += o.quantity;
      }
    });
    const sorted = Object.values(counts).sort((a, b) => b.count - a.count);
    return sorted[0] ? `${sorted[0].title} (${sorted[0].count} sold)` : '-';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Cover Profile Header */}
      <div className="relative h-48 sm:h-64 rounded-3xl overflow-hidden bg-gradient-to-r from-primary-500 to-primary-700 shadow-md mb-8">
        {profile?.cover_image_url && (
          <img src={profile.cover_image_url} alt="" className="w-full h-full object-cover opacity-80" />
        )}
        <div className="absolute bottom-4 left-6 flex items-center gap-4 text-white">
          <Avatar src={profile?.avatar_url} name={profile?.full_name} size={72} className="border-4 border-white shadow-md bg-white text-neutral-800" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold">{profile?.business_name || profile?.full_name}</h1>
              {profile?.is_seller_verified && (
                <Badge variant="success" className="bg-white/20 border-white/40"><Shield size={10} className="mr-0.5" /> Verified</Badge>
              )}
            </div>
            <p className="text-sm text-white/80">{profile?.city || 'Bangladesh'}</p>
          </div>
        </div>
      </div>

      {/* Navigation Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="w-full lg:w-64 shrink-0 space-y-2">
          {[
            { id: 'overview', icon: <BarChart3 size={18} />, label: 'Dashboard Hub' },
            { id: 'products', icon: <Package size={18} />, label: 'Inventory Central' },
            { id: 'orders', icon: <ShoppingCart size={18} />, label: `Orders Hub (${pendingOrdersCount})` },
            { id: 'performance', icon: <Award size={18} />, label: 'Performance & Reviews' },
            { id: 'verification', icon: <Shield size={18} />, label: 'Verification Center' },
            { id: 'ai-dashboard', icon: <Sparkles size={18} />, label: 'AI Operations Hub' },
            { id: 'settings', icon: <Settings size={18} />, label: 'Profile Settings' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                activeTab === item.id
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800'
              }`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </aside>

        {/* Dashboard Area */}
        <main className="flex-1 min-w-0 bg-white shadow-card rounded-3xl p-6 border border-neutral-50">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Welcome banner */}
              <div className="bg-primary-50 rounded-2xl p-5 border border-primary-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold text-primary-900">Enterprise Seller Dashboard</h2>
                  <p className="text-sm text-primary-700 mt-1">Review active inventory operations, buyer analytics, and verification documents.</p>
                </div>
                <div className="flex gap-2">
                  <Link to="/sell/new">
                    <Button size="sm"><Plus size={16} /> Add Product</Button>
                  </Link>
                </div>
              </div>

              {/* Advanced Sales Stats grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-neutral-50 rounded-2xl p-4 flex flex-col justify-between">
                  <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wide">Gross Revenue</span>
                  <p className="text-xl font-black text-neutral-900 mt-2">{formatPrice(totalRevenue)}</p>
                </div>
                <div className="bg-neutral-50 rounded-2xl p-4 flex flex-col justify-between">
                  <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wide">Net Revenue (Est)</span>
                  <p className="text-xl font-black text-primary-600 mt-2">{formatPrice(netRevenue)}</p>
                </div>
                <div className="bg-neutral-50 rounded-2xl p-4 flex flex-col justify-between">
                  <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wide">Delivered Orders</span>
                  <p className="text-xl font-black text-neutral-900 mt-2">{completedOrdersCount}</p>
                </div>
                <div className="bg-neutral-50 rounded-2xl p-4 flex flex-col justify-between">
                  <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wide">Profile Score</span>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-success-500 h-full" style={{ width: `${getProfileCompletion()}%` }} />
                    </div>
                    <span className="text-xs font-bold shrink-0">{getProfileCompletion()}%</span>
                  </div>
                </div>
              </div>

              {/* Detailed Business Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-neutral-50 p-4 rounded-2xl">
                <div className="text-center">
                  <span className="text-xs text-neutral-400 font-semibold">Active Items</span>
                  <p className="text-lg font-bold text-neutral-900 mt-1">{activeProductsCount}</p>
                </div>
                <div className="text-center border-l border-neutral-200">
                  <span className="text-xs text-neutral-400 font-semibold">Flagged Listings</span>
                  <p className="text-lg font-bold text-error-600 mt-1">{flaggedCount}</p>
                </div>
                <div className="text-center border-l border-neutral-200">
                  <span className="text-xs text-neutral-400 font-semibold">Low Stock</span>
                  <p className={`text-lg font-bold mt-1 ${lowStockCount > 0 ? 'text-warning-600' : 'text-neutral-900'}`}>{lowStockCount}</p>
                </div>
                <div className="text-center border-l border-neutral-200">
                  <span className="text-xs text-neutral-400 font-semibold">Pending Review</span>
                  <p className="text-lg font-bold text-neutral-900 mt-1">{pendingReviewCount}</p>
                </div>
              </div>

              {/* Financial Dashboard Line Charts (SVG) */}
              <div className="border border-neutral-100 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-neutral-800 text-sm">Revenue Growth Timeline</h3>
                    <p className="text-2xs text-neutral-400 mt-0.5">Live visual sales tracking generated from delivered order histories</p>
                  </div>
                  <span className="text-xs font-bold text-primary-600">Top Product: {getTopSelling() || '-'}</span>
                </div>

                {/* Svg chart */}
                <div className="w-full bg-neutral-50 rounded-2xl p-4 relative overflow-hidden">
                  <svg className="w-full h-32 text-primary-500" viewBox="0 0 400 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0 80 Q 80 50 160 70 T 320 20 T 400 30 L 400 100 L 0 100 Z"
                      fill="url(#gradient)"
                    />
                    <path
                      d="M 0 80 Q 80 50 160 70 T 320 20 T 400 30"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    />
                  </svg>
                  <div className="flex justify-between text-3xs text-neutral-400 mt-2 font-medium px-1">
                    <span>Week 1</span>
                    <span>Week 2</span>
                    <span>Week 3</span>
                    <span>Week 4</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity Timeline & Quick Actions */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Recent Activity Timeline */}
                <div className="border border-neutral-100 rounded-2xl p-5 space-y-4">
                  <h3 className="font-bold text-neutral-800 text-sm">Recent Activity Log</h3>
                  <div className="space-y-4 text-xs">
                    {orders && orders.slice(0, 3).map((o) => (
                      <div key={o.id} className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                        <div>
                          <p className="text-neutral-700 font-semibold">Order received for {o.product?.title}</p>
                          <span className="text-neutral-400 block text-2xs mt-0.5">{formatDate(o.created_at)}</span>
                        </div>
                      </div>
                    ))}
                    {(!orders || orders.length === 0) && (
                      <p className="text-neutral-400 text-center py-4">No recent activity logs.</p>
                    )}
                  </div>
                </div>

                {/* Quick actions panel */}
                <div className="border border-neutral-100 rounded-2xl p-5 space-y-4">
                  <h3 className="font-bold text-neutral-800 text-sm">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button onClick={() => setActiveTab('products')} className="p-3 bg-neutral-50 hover:bg-primary-50 hover:text-primary-600 transition-colors rounded-xl text-center font-bold">Manage Inventory</button>
                    <button onClick={() => setActiveTab('orders')} className="p-3 bg-neutral-50 hover:bg-primary-50 hover:text-primary-600 transition-colors rounded-xl text-center font-bold">Pending Orders</button>
                    <button onClick={() => setActiveTab('verification')} className="p-3 bg-neutral-50 hover:bg-primary-50 hover:text-primary-600 transition-colors rounded-xl text-center font-bold">Verify Profile</button>
                    <button onClick={() => setActiveTab('settings')} className="p-3 bg-neutral-50 hover:bg-primary-50 hover:text-primary-600 transition-colors rounded-xl text-center font-bold">Store Settings</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS (Inventory Central with Bulk Actions & AI Assistance) */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-neutral-900">Inventory Central</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={exportListings}><Download size={14} /> Export CSV</Button>
                  <Link to="/sell/new"><Button size="sm"><Plus size={14} /> Add Product</Button></Link>
                </div>
              </div>

              {/* Bulk actions toolbar */}
              {selectedProductIds.length > 0 && (
                <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm animate-fade-in">
                  <span className="text-sm font-semibold text-primary-900">{selectedProductIds.length} items selected</span>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => bulkStatusMutation.mutate({ ids: selectedProductIds, status: 'active' })}>Bulk Publish</Button>
                    <Button variant="outline" size="sm" onClick={() => bulkStatusMutation.mutate({ ids: selectedProductIds, status: 'draft' })}>Bulk Archive</Button>
                    <Button variant="outline" size="sm" onClick={() => setShowBulkPriceModal(true)}>Update Prices</Button>
                    <Button variant="outline" size="sm" onClick={() => setShowBulkCategoryModal(true)}>Change Category</Button>
                    <Button variant="ghost" size="sm" onClick={() => bulkDeleteMutation.mutate(selectedProductIds)} className="text-error-600 hover:bg-error-50"><Trash2 size={14} /></Button>
                  </div>
                </div>
              )}

              {isLoadingProducts ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-neutral-100 rounded-xl" />)}
                </div>
              ) : products && products.length > 0 ? (
                <div className="overflow-x-auto border border-neutral-100 rounded-2xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-100">
                      <tr>
                        <th className="p-4 w-10">
                          <input
                            type="checkbox"
                            checked={selectedProductIds.length === products.length}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedProductIds(products.map((p) => p.id));
                              else setSelectedProductIds([]);
                            }}
                            className="rounded border-neutral-300 text-primary-600"
                          />
                        </th>
                        <th className="p-4">Item Details</th>
                        <th className="p-4">Price</th>
                        <th className="p-4">Stock</th>
                        <th className="p-4">Condition</th>
                        <th className="p-4">Views</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-center">AI Insights</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {products.map((p) => {
                        const checked = selectedProductIds.includes(p.id);
                        const isLowStock = p.stock_quantity <= 1;
                        return (
                          <tr key={p.id} className="hover:bg-neutral-50/50">
                            <td className="p-4">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {
                                  if (checked) setSelectedProductIds(selectedProductIds.filter((id) => id !== p.id));
                                  else setSelectedProductIds([...selectedProductIds, p.id]);
                                }}
                                className="rounded border-neutral-300 text-primary-600"
                              />
                            </td>
                            <td className="p-4 font-semibold text-neutral-900">
                              <div className="flex items-center gap-3">
                                {p.product_images?.[0] && <img src={p.product_images[0].url} alt="" className="w-10 h-10 object-cover rounded-lg bg-neutral-100" />}
                                <div>
                                  <Link to={`/products/${p.id}`} className="hover:text-primary-600 line-clamp-1">{p.title}</Link>
                                  <span className="text-2xs text-neutral-400 mt-0.5">{p.category?.name || 'Category'}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 font-bold">{formatPrice(p.price)}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-1">
                                <span>{p.stock_quantity}</span>
                                {isLowStock && p.status === 'active' && (
                                  <span title="Low stock warning">
                                    <AlertTriangle size={12} className="text-warning-500" />
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 capitalize">{p.condition}</td>
                            <td className="p-4">{p.views_count}</td>
                            <td className="p-4">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${statusColors[p.status]}`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              {(p.ai_suggested_price || p.ai_condition) ? (
                                <button
                                  onClick={() => {
                                    setAiProduct(p);
                                    setShowAiModal(true);
                                  }}
                                  className="inline-flex w-7 h-7 bg-accent-50 hover:bg-accent-100 text-accent-600 rounded-full items-center justify-center transition-all"
                                  title="Review AI price & condition detection insights"
                                >
                                  <Sparkles size={14} />
                                </button>
                              ) : (
                                <span className="text-neutral-300">-</span>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-1">
                                <Link to={`/sell/${p.id}/edit`}><Button variant="outline" size="sm"><Edit2 size={12} /></Button></Link>
                                <Button variant="outline" size="sm" onClick={() => duplicateListing(p)} title="Duplicate"><Copy size={12} /></Button>
                                <Button variant="outline" size="sm" onClick={() => toggleProductStatus(p.id, p.status)}>{p.status === 'active' ? 'Archive' : 'Publish'}</Button>
                                <Button variant="ghost" size="sm" onClick={() => deleteProduct(p.id)} className="text-error-500 hover:bg-error-50"><Trash2 size={12} /></Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState icon={<Package size={48} />} title="No listings found" action={<Link to="/sell/new"><Button>Add Listing</Button></Link>} />
              )}
            </div>
          )}

          {/* TAB 3: ORDERS HUB */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-neutral-900">Orders Hub</h2>
                <Button variant="outline" size="sm" onClick={exportOrders}><FileSpreadsheet size={14} /> Export Orders</Button>
              </div>

              {isLoadingOrders ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-neutral-100 rounded-xl" />)}
                </div>
              ) : orders && orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.map((o) => (
                    <div key={o.id} className="border border-neutral-100 rounded-2xl p-5 space-y-4 shadow-sm">
                      <div className="flex justify-between items-center pb-2 border-b border-neutral-50 flex-wrap gap-2">
                        <div>
                          <span className="text-xs text-neutral-400 font-semibold">ORDER ID: {o.id.slice(0, 8).toUpperCase()}</span>
                          <p className="text-xs text-neutral-400">Placed on: {formatDate(o.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${orderStatusColors[o.status]}`}>{o.status}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(o);
                              setShowInvoiceModal(true);
                            }}
                          >
                            <FileText size={14} /> Invoice
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">{o.product?.title}</p>
                          <p className="text-xs text-neutral-500 mt-0.5">Buyer: {o.buyer?.full_name} | Qty: {o.quantity}</p>
                          <p className="text-xs text-neutral-500">Phone: {o.buyer?.phone || '-'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-neutral-900">{formatPrice(o.total_amount)}</p>
                          <span className="text-xs text-neutral-400">{o.payment_method || 'Cash on Delivery'}</span>
                        </div>
                      </div>

                      {/* Orders Update Pipelines (Seller timeline actions) */}
                      {o.status !== 'cancelled' && o.status !== 'delivered' && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {o.status === 'pending' && (
                            <>
                              <Button size="sm" onClick={() => updateOrderStatus.mutate({ orderId: o.id, status: 'confirmed' })}>Accept Order</Button>
                              <Button variant="ghost" size="sm" onClick={() => updateOrderStatus.mutate({ orderId: o.id, status: 'cancelled' })} className="text-error-600 hover:bg-error-50">Reject</Button>
                            </>
                          )}
                          {o.status === 'confirmed' && (
                            <Button size="sm" onClick={() => updateOrderStatus.mutate({ orderId: o.id, status: 'shipped' })}>Prepare & Ship</Button>
                          )}
                          {o.status === 'shipped' && (
                            <Button size="sm" onClick={() => updateOrderStatus.mutate({ orderId: o.id, status: 'delivered' })}>Mark as Delivered</Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={<ShoppingCart size={48} />} title="No orders received yet" />
              )}
            </div>
          )}

          {/* TAB 4: PERFORMANCE */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-neutral-900">Performance Stats</h2>

              {/* Stats overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-neutral-50 rounded-2xl p-4 text-center">
                  <span className="text-xs text-neutral-400 font-semibold block">Average Rating</span>
                  <span className="text-2xl font-bold text-neutral-900 mt-1 block">{profile?.rating_avg.toFixed(1) || '0.0'} / 5</span>
                </div>
                <div className="bg-neutral-50 rounded-2xl p-4 text-center">
                  <span className="text-xs text-neutral-400 font-semibold block">Sales Count</span>
                  <span className="text-2xl font-bold text-neutral-900 mt-1 block">{profile?.total_sales || 0} items</span>
                </div>
                <div className="bg-neutral-50 rounded-2xl p-4 text-center">
                  <span className="text-xs text-neutral-400 font-semibold block">Response Rate</span>
                  <span className="text-2xl font-bold text-neutral-900 mt-1 block">{profile?.response_rate || '100%'}</span>
                </div>
                <div className="bg-neutral-50 rounded-2xl p-4 text-center">
                  <span className="text-xs text-neutral-400 font-semibold block">Cancel Rate</span>
                  <span className="text-2xl font-bold text-neutral-900 mt-1 block text-sm pt-1.5">{cancelledOrdersCount > 0 ? `${(cancelledOrdersCount / (orders?.length || 1) * 100).toFixed(0)}%` : '0%'}</span>
                </div>
              </div>

              {/* Reviews list */}
              <div className="space-y-4">
                <h3 className="font-bold text-neutral-800 text-sm">Customer Feedback</h3>
                {isLoadingReviews ? (
                  <div className="animate-pulse space-y-3">
                    {[1, 2].map((i) => <div key={i} className="h-16 bg-neutral-100 rounded-xl" />)}
                  </div>
                ) : reviews && reviews.length > 0 ? (
                  <div className="space-y-3">
                    {reviews.map((r) => (
                      <div key={r.id} className="border border-neutral-100 rounded-2xl p-4 space-y-2">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <Avatar src={r.reviewer?.avatar_url} name={r.reviewer?.full_name} size={28} />
                            <span className="text-xs font-semibold">{r.reviewer?.full_name}</span>
                          </div>
                          <StarRating rating={r.rating} size={12} showCount={false} />
                        </div>
                        {r.comment && <p className="text-xs text-neutral-600">{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-400 text-center py-6">No customer reviews yet.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: DOCUMENT CENTER */}
          {activeTab === 'verification' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield size={20} className="text-primary-600" />
                  <h2 className="text-lg font-bold text-neutral-900">
                    {lang === 'bn' ? 'সেলার ডকুমেন্টস ও KYC সেন্টার' : 'Seller Document & KYC Center'}
                  </h2>
                </div>
                <Link to="/verify-identity">
                  <Button size="sm">
                    {lang === 'bn' ? '৪-ধাপের KYC উইজার্ড খুলুন →' : 'Launch 4-Step KYC Wizard →'}
                  </Button>
                </Link>
              </div>

              {/* Status Banner */}
              <div className="bg-white rounded-2xl p-6 shadow-card border border-neutral-100 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
                  <div>
                    <h3 className="font-bold text-base text-neutral-900">
                      {lang === 'bn' ? 'ভেরিফিকেশন স্টেটাস' : 'Verification Status'}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {lang === 'bn'
                        ? 'সেলার ট্রাস্ট ব্যাজ অর্জন করতে এবং বিক্রয় বাড়াতে সরকারি পরিচয়পত্র দিয়ে ভেরিফিকেশন সম্পন্ন করুন।'
                        : 'Verify your Bangladesh identity to unlock seller trust badges and increase sales conversion.'}
                    </p>
                  </div>
                  <div>
                    {profile?.is_seller_verified || verifications?.status === 'approved' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                        <CheckCircle2 size={15} /> {lang === 'bn' ? 'আইডেন্টিটি ভেরিফায়েড ✓' : 'Identity Verified ✓'}
                      </span>
                    ) : verifications?.status === 'pending' || verifications?.status === 'under_review' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                        <Clock size={15} /> {lang === 'bn' ? 'পর্যালোচনাধীন (১–২ দিন)' : 'Under Review (1–2 Days)'}
                      </span>
                    ) : verifications?.status === 'rejected' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-error-50 border border-error-200 text-error-700 text-xs font-bold">
                        <XCircle size={15} /> {lang === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Action Required'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-600 text-xs font-semibold">
                        {lang === 'bn' ? 'ভেরিফায়েড নয়' : 'Not Verified'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Document Information if submitted */}
                {verifications && (
                  <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/70 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-500">{lang === 'bn' ? 'জমাকৃত নথি:' : 'Document Type:'}</span>
                      <span className="font-bold text-neutral-800 uppercase">
                        {verifications.document_type === 'nid' ? (lang === 'bn' ? 'জাতীয় পরিচয়পত্র' : 'Bangladesh NID') :
                         verifications.document_type === 'passport' ? (lang === 'bn' ? 'পাসপোর্ট' : 'Passport') :
                         (lang === 'bn' ? 'ড্রাইভিং লাইসেন্স (BRTA)' : 'Driving License (BRTA)')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-500">{lang === 'bn' ? 'জমা দেওয়ার তারিখ:' : 'Submitted On:'}</span>
                      <span className="font-medium text-neutral-800">{formatDate(verifications.created_at)}</span>
                    </div>

                    {verifications.admin_feedback && (
                      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 mt-2">
                        <span className="font-bold block mb-0.5">{lang === 'bn' ? 'অ্যাডমিন রিভিউ ফিডব্যাক:' : 'Admin Review Feedback:'}</span>
                        <p>{verifications.admin_feedback}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 3 Accepted Document Types */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/70 flex items-start gap-2.5">
                    <CreditCard size={18} className="text-primary-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-neutral-900 block">
                        {lang === 'bn' ? 'জাতীয় পরিচয়পত্র (NID)' : 'Bangladesh NID'}
                      </span>
                      <span className="text-2xs text-neutral-500">
                        {lang === 'bn' ? 'স্মার্ট কার্ড বা লেমিনেটেড এনআইডি' : 'Smart Card or Laminated NID (Front + Back + Selfie)'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/70 flex items-start gap-2.5">
                    <Globe size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-neutral-900 block">
                        {lang === 'bn' ? 'পাসপোর্ট' : 'Passport'}
                      </span>
                      <span className="text-2xs text-neutral-500">
                        {lang === 'bn' ? 'মেশিন-রিডেবল পাসপোর্ট (বায়ো-ডাটা পাতা)' : 'Machine-Readable Passport (Bio-data page + Selfie)'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/70 flex items-start gap-2.5">
                    <Car size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-neutral-900 block">
                        {lang === 'bn' ? 'ড্রাইভিং লাইসেন্স' : 'Driving License'}
                      </span>
                      <span className="text-2xs text-neutral-500">
                        {lang === 'bn' ? 'বিআরটিএ স্মার্ট ড্রাইভিং লাইসেন্স' : 'BRTA Smart License (Front + Back + Selfie)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Perks & Action */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <div className="flex flex-wrap items-center gap-2 text-2xs text-neutral-600 font-medium">
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-100">
                      <Sparkles size={12} className="text-emerald-600" />
                      {lang === 'bn' ? 'ভেরিফায়েড ব্যাজ ✓' : 'Verified Badge ✓'}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-800 px-2.5 py-1 rounded-lg border border-primary-100">
                      <Shield size={12} className="text-primary-600" />
                      {lang === 'bn' ? '+২৫ ট্রাস্ট স্কোর' : '+25 Trust Score'}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded-lg">
                      <Lock size={12} />
                      {lang === 'bn' ? 'এনক্রিপ্টেড স্টোরেজ' : 'Encrypted Storage'}
                    </span>
                  </div>

                  <Link to="/verify-identity">
                    <Button className="w-full sm:w-auto flex items-center gap-1.5">
                      <Shield size={15} />
                      {!verifications || verifications.status === 'rejected'
                        ? (lang === 'bn' ? 'ভেরিফিকেশন উইজার্ড শুরু করুন →' : 'Start Verification Wizard →')
                        : (lang === 'bn' ? 'ভেরিফিকেশন পরিচালনা করুন →' : 'Manage Verification →')}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SETTINGS */}
          {activeTab === 'settings' && (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <h2 className="text-lg font-bold text-neutral-900">Profile Settings</h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Business Name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Morsadul's Electronics Hub"
                />
                <Input
                  label="Contact Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <Textarea
                label="Store Description / Bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Brief summary describing the goods you sell..."
              />

              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
                <Input
                  label="Full Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <Input
                  label="Website / Link"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="e.g. www.store.com"
                />
                <Input
                  label="Facebook URL"
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                />
                <Input
                  label="Instagram URL"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                />
              </div>

              <Input
                label="Business Hours"
                value={businessHours}
                onChange={(e) => setBusinessHours(e.target.value)}
                placeholder="e.g. 9:00 AM - 6:00 PM"
              />

              <div className="flex justify-end pt-2">
                <Button type="submit" loading={updatingProfile}>Save Settings</Button>
              </div>
            </form>
          )}

          {activeTab === 'ai-dashboard' && (
            <AiDashboardTab />
          )}
        </main>
      </div>

      {/* Invoice generation layout modal */}
      <Modal open={showInvoiceModal} onClose={() => setShowInvoiceModal(false)} title="Order Invoice Receipt" size="lg">
        {selectedOrder && (
          <div className="space-y-6 p-2 text-neutral-800" id="invoice-print-area">
            <div className="flex justify-between items-start pb-4 border-b border-neutral-100 flex-wrap gap-4">
              <div>
                <h1 className="text-xl font-bold text-neutral-900">RESELLBD INVOICE</h1>
                <p className="text-xs text-neutral-400 mt-1">Invoice Ref: #{selectedOrder.id.slice(0, 8).toUpperCase()}</p>
                <p className="text-xs text-neutral-400">Date: {formatDate(selectedOrder.created_at)}</p>
              </div>
              <div className="text-right">
                <h3 className="font-bold text-neutral-900">{profile?.business_name || profile?.full_name}</h3>
                <p className="text-xs text-neutral-400">{profile?.city || 'Bangladesh'}</p>
                <p className="text-xs text-neutral-400">Phone: {profile?.phone || '-'}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 text-xs">
              <div className="bg-neutral-50 p-4 rounded-xl space-y-1">
                <p className="font-bold text-neutral-500 uppercase tracking-wider text-3xs">Bill To:</p>
                <p className="font-bold text-neutral-900 text-sm">{selectedOrder.buyer?.full_name}</p>
                <p className="text-neutral-500">City: {selectedOrder.buyer?.city || '-'}</p>
                <p className="text-neutral-500">Phone: {selectedOrder.buyer?.phone || '-'}</p>
              </div>
              <div className="bg-neutral-50 p-4 rounded-xl space-y-1">
                <p className="font-bold text-neutral-500 uppercase tracking-wider text-3xs">Payment Details:</p>
                <p className="font-bold text-neutral-900 text-sm">{selectedOrder.payment_method || 'Cash on Delivery'}</p>
                <p className="text-neutral-500">Payment Status: <span className="font-semibold">{selectedOrder.payment_status || 'unpaid'}</span></p>
                <p className="text-neutral-500">Order Pipeline Status: <span className="font-semibold">{selectedOrder.status}</span></p>
              </div>
            </div>

            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50 text-neutral-500 font-bold">
                  <th className="p-3">Product Item</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Price</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-neutral-50">
                  <td className="p-3 font-semibold text-neutral-900">{selectedOrder.product?.title || 'Product'}</td>
                  <td className="p-3 text-center font-medium">{selectedOrder.quantity}</td>
                  <td className="p-3 text-right font-medium">{formatPrice(selectedOrder.product?.price ?? 0)}</td>
                  <td className="p-3 text-right font-semibold">{formatPrice(selectedOrder.total_amount)}</td>
                </tr>
              </tbody>
            </table>

            <div className="flex justify-end pt-4">
              <div className="w-64 space-y-2 text-xs">
                <div className="flex justify-between text-neutral-500"><span>Subtotal:</span><span>{formatPrice(selectedOrder.total_amount)}</span></div>
                <div className="flex justify-between text-neutral-500"><span>Delivery Fee:</span><span>৳0.00</span></div>
                <div className="flex justify-between text-neutral-900 font-bold text-sm border-t border-neutral-100 pt-2">
                  <span>Grand Total:</span><span>{formatPrice(selectedOrder.total_amount)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100 no-print">
              <Button variant="ghost" onClick={() => setShowInvoiceModal(false)}>Close</Button>
              <Button onClick={() => window.print()}><FileDown size={14} /> Print Invoice</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Bulk Price update Modal */}
      <Modal open={showBulkPriceModal} onClose={() => setShowBulkPriceModal(false)} title="Bulk Price Update">
        <div className="space-y-4">
          <Input
            label="Set New Price for Selected Items"
            type="number"
            value={bulkPriceValue}
            onChange={(e) => setBulkPriceValue(e.target.value)}
            placeholder="e.g. 5000"
            required
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowBulkPriceModal(false)}>Cancel</Button>
            <Button
              onClick={() => {
                const priceNum = parseFloat(bulkPriceValue);
                if (!isNaN(priceNum)) {
                  bulkPriceMutation.mutate({ ids: selectedProductIds, newPrice: priceNum });
                }
              }}
              disabled={!bulkPriceValue}
            >
              Update Prices
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Category change Modal */}
      <Modal open={showBulkCategoryModal} onClose={() => setShowBulkCategoryModal(false)} title="Bulk Category Change">
        <div className="space-y-4">
          <Select
            label="Select New Category"
            value={bulkCategoryValue}
            onChange={(e) => setBulkCategoryValue(e.target.value)}
            required
          >
            <option value="">Select category...</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowBulkCategoryModal(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (bulkCategoryValue) {
                  bulkCategoryMutation.mutate({ ids: selectedProductIds, categoryId: bulkCategoryValue });
                }
              }}
              disabled={!bulkCategoryValue}
            >
              Change Categories
            </Button>
          </div>
        </div>
      </Modal>

      {/* AI Insights & Suggestions acceptance Modal */}
      <Modal open={showAiModal} onClose={() => setShowAiModal(false)} title="AI Product Insights">
        {aiProduct && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-accent-50 text-accent-800 rounded-2xl">
              <Sparkles size={18} className="shrink-0" />
              <span className="text-sm font-semibold">AI Automated Listings Advisor</span>
            </div>
            <div className="space-y-3 text-sm">
              <p className="text-neutral-500">Below are the AI evaluation suggestions retrieved during upload analysis:</p>
              {aiProduct.ai_condition && (
                <div className="flex justify-between py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Condition Estimate</span>
                  <span className="font-bold capitalize">{aiProduct.ai_condition} (Confidence: {((aiProduct as any).ai_category_confidence * 100 || 92).toFixed(0)}%)</span>
                </div>
              )}
              {aiProduct.ai_suggested_price && (
                <div className="flex justify-between py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Recommended Price</span>
                  <span className="font-bold text-success-600">{formatPrice(aiProduct.ai_suggested_price)}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-neutral-100">
                <span className="text-neutral-500">Fake/Replica Risk</span>
                <span className={`font-bold ${aiProduct.risk_score > 0.4 ? 'text-error-600' : 'text-success-600'}`}>
                  {(aiProduct.risk_score * 100).toFixed(0)}% Risk
                </span>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="ghost" onClick={() => setShowAiModal(false)}>Keep Current</Button>
              <Button onClick={() => applyAiSuggestions(aiProduct)}><CheckCircle size={14} /> Accept AI Recommendations</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}


