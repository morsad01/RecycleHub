import { useState } from 'react';
import type { PaymentProvider } from '../types/payment.types';
import { useI18n } from '../../../i18n/I18nContext';

interface PaymentMethodSelectorProps {
  value: PaymentProvider;
  onChange: (value: PaymentProvider) => void;
}

export function PaymentMethodSelector({ value, onChange }: PaymentMethodSelectorProps) {
  const { t } = useI18n();

  const methods: { id: PaymentProvider; label: string; icon: string }[] = [
    { id: 'cod', label: t('payment.cod') || 'Cash on Delivery', icon: '💵' },
    { id: 'bkash', label: t('payment.bkash') || 'bKash', icon: '📱' },
    { id: 'nagad', label: t('payment.nagad') || 'Nagad', icon: '📱' },
    { id: 'rocket', label: t('payment.rocket') || 'Rocket', icon: '🚀' },
    { id: 'sslcommerz', label: t('payment.sslcommerz') || 'Cards/Net Banking', icon: '💳' },
    { id: 'stripe', label: t('payment.stripe') || 'International Cards', icon: '🌍' },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-neutral-900">{t('payment.method') || 'Payment Method'}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {methods.map((method) => (
          <button
            key={method.id}
            type="button"
            onClick={() => onChange(method.id)}
            className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
              value === method.id
                ? 'border-primary-500 bg-primary-50 shadow-sm ring-1 ring-primary-500'
                : 'border-neutral-200 bg-white hover:border-primary-300 hover:bg-neutral-50'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${
              value === method.id ? 'bg-primary-100' : 'bg-neutral-100'
            }`}>
              {method.icon}
            </div>
            <div className="font-semibold text-neutral-900">{method.label}</div>
            
            {value === method.id && (
              <div className="ml-auto w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
