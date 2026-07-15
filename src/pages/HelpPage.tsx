import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, FileText, HelpCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useI18n } from '../i18n/I18nContext';

export function HelpPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<'safety' | 'faq' | 'privacy' | 'terms'>('safety');

  const contentKeys: Record<string, string> = {
    safety: 'safety_guidelines',
    privacy: 'privacy_policy',
    terms: 'terms_of_service',
  };

  const { data: content } = useQuery({
    queryKey: ['platform-content', contentKeys[tab]],
    queryFn: async () => {
      const { data } = await supabase
        .from('platform_content')
        .select('*')
        .eq('key', contentKeys[tab])
        .maybeSingle();
      return data?.content ?? null;
    },
    enabled: tab !== 'faq',
  });

  const tabs = [
    { key: 'safety', label: t('help.safetyTitle'), icon: <Shield size={16} /> },
    { key: 'faq', label: t('help.faqTitle'), icon: <HelpCircle size={16} /> },
    { key: 'privacy', label: t('help.privacyTitle'), icon: <FileText size={16} /> },
    { key: 'terms', label: t('help.termsTitle'), icon: <FileText size={16} /> },
  ] as const;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">{t('help.title')}</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
        {tabs.map((tabItem) => (
          <button
            key={tabItem.key}
            onClick={() => setTab(tabItem.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              tab === tabItem.key ? 'bg-primary-500 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {tabItem.icon} {tabItem.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        {tab === 'faq' ? (
          <div className="space-y-6">
            {[
              { q: 'How do I sell an item?', a: 'Click "Sell" in the navigation, upload photos of your item, and our AI will suggest a category, condition, and price. Fill in the details and publish.' },
              { q: 'How do I become a verified seller?', a: 'Go to your Profile page and submit your NID or business info under "Become a Verified Seller". An admin will review your submission.' },
              { q: 'Is it safe to buy on RecycleHub?', a: 'Yes! We use AI to detect fake listings, verified seller badges for trust, and in-app messaging so you never have to share personal contact info.' },
              { q: 'How does delivery work?', a: 'After placing an order, the seller confirms and ships it. You can track the status (Pending → Confirmed → Shipped → Delivered) in your Orders page.' },
              { q: 'Can I cancel an order?', a: 'Yes, you can cancel while the order is still in "Pending" status. Once confirmed, contact the seller through messages.' },
            ].map((faq, i) => (
              <div key={i}>
                <h3 className="font-semibold text-neutral-900 mb-1">{faq.q}</h3>
                <p className="text-sm text-neutral-600">{faq.a}</p>
              </div>
            ))}
          </div>
        ) : content ? (
          <div className="prose prose-sm max-w-none">
            <p className="text-sm text-neutral-700 whitespace-pre-wrap">{content}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tab === 'safety' && (
              <>
                <h3 className="font-semibold text-neutral-900">Safe Trading Tips</h3>
                <ul className="text-sm text-neutral-600 space-y-2 list-disc pl-5">
                  <li>Meet in public places for in-person exchanges</li>
                  <li>Use in-app messaging — don't share personal contact info</li>
                  <li>Check seller ratings and verified badges</li>
                  <li>Look for the "AI-checked listing" badge for quality assurance</li>
                  <li>Report any suspicious listings or users</li>
                  <li>Never pay outside the platform</li>
                </ul>
              </>
            )}
            {tab === 'privacy' && (
              <p className="text-sm text-neutral-600">
                RecycleHub respects your privacy. We collect only the information necessary to provide our marketplace services. Your data is protected by Row Level Security policies and is never shared with third parties without consent. You can request data deletion at any time.
              </p>
            )}
            {tab === 'terms' && (
              <p className="text-sm text-neutral-600">
                By using RecycleHub, you agree to: list only items you own, provide accurate descriptions, not post prohibited items, respect other users, and follow our community guidelines. RecycleHub reserves the right to remove listings and suspend accounts that violate these terms.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
