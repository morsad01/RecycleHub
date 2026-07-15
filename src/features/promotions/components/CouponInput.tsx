import { useState } from 'react';
import { Tag, CheckCircle2, XCircle } from 'lucide-react';
import { useI18n } from '../../../i18n/I18nContext';
import { couponService } from '../services/couponService';

interface CouponInputProps {
  orderAmount: number;
  onApply: (discountAmount: number, code: string) => void;
  onRemove: () => void;
}

export function CouponInput({ orderAmount, onApply, onRemove }: CouponInputProps) {
  const { t } = useI18n();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  const handleApply = async () => {
    if (!code.trim()) return;
    setIsLoading(true);
    setError(null);
    
    const result = await couponService.validateCoupon(code, orderAmount);
    
    setIsLoading(false);
    if (result.isValid) {
      setAppliedCode(code.toUpperCase());
      setDiscountAmount(result.discountAmount);
      onApply(result.discountAmount, code.toUpperCase());
    } else {
      setError(result.errorMessage || 'Invalid coupon');
    }
  };

  const handleRemove = () => {
    setCode('');
    setAppliedCode(null);
    setDiscountAmount(0);
    setError(null);
    onRemove();
  };

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between p-4 bg-success-50 border border-success-200 rounded-xl">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="text-success-600" size={20} />
          <div>
            <p className="font-semibold text-success-900">{appliedCode} applied</p>
            <p className="text-sm text-success-700">-৳{discountAmount.toLocaleString()} discount</p>
          </div>
        </div>
        <button onClick={handleRemove} className="text-sm text-success-700 font-medium hover:text-success-900">
          {t('promo.remove') || 'Remove'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
            <Tag size={18} />
          </div>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder={t('promo.couponCode') || 'Coupon Code'}
            className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none uppercase"
          />
        </div>
        <button
          type="button"
          onClick={handleApply}
          disabled={isLoading || !code.trim()}
          className="px-4 py-2 bg-neutral-900 text-white font-medium rounded-xl hover:bg-black disabled:opacity-50 transition-colors"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            t('promo.apply') || 'Apply'
          )}
        </button>
      </div>
      {error && (
        <div className="flex items-center gap-1.5 text-error-600 text-sm">
          <XCircle size={14} />
          {error}
        </div>
      )}
    </div>
  );
}
