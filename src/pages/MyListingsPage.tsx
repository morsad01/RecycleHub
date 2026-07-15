import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Eye, Package, Copy, EyeOff, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui';
import { EmptyState } from '../components/ui/EmptyState';
import { formatPrice, statusColors } from '../lib/utils';
import type { ProductWithRelations } from '../types';

export function MyListingsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['my-listings'],
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('products').delete().eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      toast('Listing deleted', 'success');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (product: ProductWithRelations) => {
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
      };
      
      const { data, error } = await supabase.from('products').insert(duplicateData).select('id').single();
      if (error) throw error;

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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      toast('Listing duplicated as draft', 'success');
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to duplicate listing', 'error');
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'draft' }) => {
      await supabase.from('products').update({ status }).eq('id', id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      toast(variables.status === 'active' ? 'Listing published' : 'Listing archived as draft', 'success');
    },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">{t('myListings.title')}</h1>
        <Link to="/sell/new">
          <Button><Plus size={18} /> {t('nav.sell')}</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-neutral-200 rounded-2xl" />)}
        </div>
      ) : products && products.length > 0 ? (
        <div className="space-y-3">
          {products.map((product) => {
            const img = product.product_images?.[0];
            const statusKey = `status.${product.status}` as const;
            return (
              <div key={product.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-white rounded-2xl shadow-card">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-neutral-100 shrink-0">
                    {img ? <img src={img.url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-neutral-300"><Package size={24} /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/products/${product.id}`} className="font-medium text-neutral-900 hover:text-primary-600 truncate block">
                      {product.title}
                    </Link>
                    <p className="text-sm text-neutral-500">{formatPrice(product.price)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[product.status]}`}>
                        {t(statusKey)}
                      </span>
                      <span className="text-xs text-neutral-500 flex items-center gap-1"><Eye size={12} /> {product.views_count}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 justify-end">
                  <Link to={`/sell/${product.id}/edit`}>
                    <Button variant="outline" size="sm" title="Edit"><Edit2 size={14} /></Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => duplicateMutation.mutate(product)}
                    title={t('listings.duplicate')}
                  >
                    <Copy size={14} />
                  </Button>

                  {product.status === 'active' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleStatusMutation.mutate({ id: product.id, status: 'draft' })}
                      title={t('listings.archive')}
                    >
                      <EyeOff size={14} />
                    </Button>
                  ) : product.status === 'draft' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleStatusMutation.mutate({ id: product.id, status: 'active' })}
                      title={t('listings.publish')}
                    >
                      <CheckCircle size={14} />
                    </Button>
                  ) : null}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm(t('myListings.confirmDelete'))) deleteMutation.mutate(product.id);
                    }}
                    className="text-error-500 hover:bg-error-50"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Package size={48} />}
          title={t('myListings.empty')}
          action={<Link to="/sell/new"><Button>{t('myListings.createFirst')}</Button></Link>}
        />
      )}
    </div>
  );
}
