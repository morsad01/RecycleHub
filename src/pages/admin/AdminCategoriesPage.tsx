import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../i18n/I18nContext';
import { useToast } from '../../components/ui/Toast';
import { AdminLayout } from './AdminLayout';
import { Button, Input, Modal } from '../../components/ui';
import type { Category } from '../../types';

export function AdminCategoriesPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [icon, setIcon] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*').order('name');
      return (data ?? []) as Category[];
    },
  });

  const save = async () => {
    if (!name.trim() || !slug.trim()) return;
    if (editing) {
      await supabase.from('categories').update({ name, slug, icon: icon || null }).eq('id', editing.id);
    } else {
      await supabase.from('categories').insert({ name, slug, icon: icon || null });
    }
    queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    setShowModal(false);
    setEditing(null);
    setName(''); setSlug(''); setIcon('');
    toast('Category saved', 'success');
  };

  const del = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    await supabase.from('categories').delete().eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    toast('Category deleted', 'success');
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">{t('admin.categories')}</h1>
        <Button onClick={() => { setEditing(null); setName(''); setSlug(''); setIcon(''); setShowModal(true); }}>
          <Plus size={18} /> {t('admin.addCategory')}
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-100">
            <tr>
              <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3">Name</th>
              <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3">Slug</th>
              <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3 hidden sm:table-cell">Icon</th>
              <th className="text-right text-xs font-medium text-neutral-500 px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {categories?.map((c) => (
              <tr key={c.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3 text-sm font-medium text-neutral-900">{c.name}</td>
                <td className="px-4 py-3 text-sm text-neutral-500">{c.slug}</td>
                <td className="px-4 py-3 text-sm text-neutral-500 hidden sm:table-cell">{c.icon ?? '-'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => { setEditing(c); setName(c.name); setSlug(c.slug); setIcon(c.icon ?? ''); setShowModal(true); }}>
                      <Edit2 size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-error-500" onClick={() => del(c.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? t('common.edit') : t('admin.addCategory')}>
        <div className="space-y-4">
          <Input label={t('admin.categoryName')} value={name} onChange={(e) => setName(e.target.value)} />
          <Input label={t('admin.categorySlug')} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="electronics" />
          <Input label={t('admin.categoryIcon')} value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="Smartphone" />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowModal(false)}>{t('common.cancel')}</Button>
            <Button onClick={save}>{t('common.save')}</Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
