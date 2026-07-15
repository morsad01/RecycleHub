import { useState } from 'react';
import { Gift, Copy, Check } from 'lucide-react';
import { useI18n } from '../../../i18n/I18nContext';

interface ReferralCardProps {
  referralCode: string;
  rewardAmount: number;
}

export function ReferralCard({ referralCode, rewardAmount }: ReferralCardProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-6 sm:p-8 border border-primary-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
            <Gift size={24} className="text-primary-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-neutral-900">
              {t('promo.referralTitle') || 'Refer and Earn'}
            </h3>
            <p className="text-neutral-600 mt-1 max-w-md">
              {t('promo.referralSubtitle') || `Share your code and earn ৳${rewardAmount} when friends make their first purchase.`}
            </p>
          </div>
        </div>
        
        <div className="w-full sm:w-auto bg-white p-2 rounded-xl shadow-sm border border-neutral-200 flex items-center gap-3 shrink-0">
          <div className="pl-3 py-1.5 font-mono font-bold text-lg text-primary-700 tracking-wider">
            {referralCode}
          </div>
          <button
            onClick={handleCopy}
            className="p-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2"
            title={t('promo.copyCode') || 'Copy Code'}
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            <span className="hidden sm:inline font-medium text-sm">
              {copied ? 'Copied!' : t('promo.copyCode') || 'Copy'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
