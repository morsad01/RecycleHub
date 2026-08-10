import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../i18n/I18nContext';
import { useToast } from '../../components/ui/Toast';
import { AdminLayout } from './AdminLayout';
import { Button, Textarea } from '../../components/ui';

const CONTENT_KEYS = [
  { key: 'safety_guidelines', labelKey: 'admin.safetyGuidelines' },
  { key: 'privacy_policy', labelKey: 'admin.privacyPolicy' },
  { key: 'terms_of_service', labelKey: 'admin.terms' },
];

export function AdminContentPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeKey, setActiveKey] = useState(CONTENT_KEYS[0].key);
  const [content, setContent] = useState('');

  const { data: currentContent } = useQuery({
    queryKey: ['admin-content', activeKey],
    queryFn: async () => {
      const { data } = await supabase
        .from('platform_content')
        .select('*')
        .eq('key', activeKey)
        .maybeSingle();
      return data?.content ?? '';
    },
    enabled: !!activeKey,
  });

  // Sync content when loaded
  if (currentContent !== undefined && currentContent !== null && content === '' && currentContent) {
    setContent(currentContent);
  }

  const save = useMutation({
    mutationFn: async () => {
      await supabase.from('platform_content').upsert({
        key: activeKey,
        content,
      }, { onConflict: 'key' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
      queryClient.invalidateQueries({ queryKey: ['platform-content'] });
      toast('Content saved', 'success');
    },
  });

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">{t('admin.editContent')}</h1>

      <div className="flex gap-2 mb-4">
        {CONTENT_KEYS.map((ck) => (
          <button
            key={ck.key}
            onClick={() => { setActiveKey(ck.key); setContent(''); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeKey === ck.key ? 'bg-primary-500 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {t(ck.labelKey as any)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-card p-6">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={16}
          placeholder="Enter content here..."
        />
        <Button onClick={() => save.mutate()} loading={save.isPending} className="mt-4">
          {t('admin.save')}
        </Button>
      </div>
    </AdminLayout>
  );
}
