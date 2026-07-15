import { Check } from 'lucide-react';
import type { Plan } from '../../../types';
import { useI18n } from '../../../i18n/I18nContext';

interface PlanCardProps {
  plan: Plan;
  billingCycle: 'monthly' | 'yearly';
  isActive?: boolean;
  onSubscribe?: (plan: Plan) => void;
}

export function PlanCard({ plan, billingCycle, isActive, onSubscribe }: PlanCardProps) {
  const { t } = useI18n();
  const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
  const isFree = price === 0;

  return (
    <div className={`relative bg-white rounded-3xl p-8 border-2 transition-all ${
      isActive 
        ? 'border-primary-500 shadow-xl shadow-primary-500/10' 
        : plan.type === 'professional'
          ? 'border-neutral-900 shadow-xl' 
          : 'border-neutral-200 hover:border-primary-300 shadow-sm'
    }`}>
      {plan.type === 'professional' && !isActive && (
        <div className="absolute -top-4 inset-x-0 flex justify-center">
          <span className="bg-neutral-900 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Most Popular
          </span>
        </div>
      )}
      
      {isActive && (
        <div className="absolute -top-4 inset-x-0 flex justify-center">
          <span className="bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            {t('plan.currentPlan') || 'Current Plan'}
          </span>
        </div>
      )}

      <div className="mb-8">
        <h3 className="text-2xl font-bold text-neutral-900">{plan.name}</h3>
        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-4xl font-bold text-neutral-900">
            {isFree ? 'Free' : `৳${price.toLocaleString()}`}
          </span>
          {!isFree && (
            <span className="text-neutral-500 font-medium">
              /{billingCycle === 'monthly' ? 'mo' : 'yr'}
            </span>
          )}
        </div>
      </div>

      <ul className="space-y-4 mb-8">
        <li className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
            <Check size={14} />
          </div>
          <span className="text-neutral-700">
            {plan.max_products === -1 ? t('plan.unlimited') || 'Unlimited' : plan.max_products} {t('plan.maxProducts') || 'Listings'}
          </span>
        </li>
        
        {plan.featured_listings_count > 0 && (
          <li className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
              <Check size={14} />
            </div>
            <span className="text-neutral-700">
              {plan.featured_listings_count} {t('plan.featuredListings') || 'Featured Listings / mo'}
            </span>
          </li>
        )}
        
        <li className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
            <Check size={14} />
          </div>
          <span className="text-neutral-700">
            {plan.ai_usage_limit} {t('plan.aiLimit') || 'AI Uses / mo'}
          </span>
        </li>

        {plan.has_analytics && (
          <li className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
              <Check size={14} />
            </div>
            <span className="text-neutral-700">{t('plan.analytics') || 'Advanced Analytics'}</span>
          </li>
        )}

        {plan.has_priority_support && (
          <li className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
              <Check size={14} />
            </div>
            <span className="text-neutral-700">{t('plan.prioritySupport') || 'Priority Support'}</span>
          </li>
        )}
      </ul>

      {onSubscribe && !isActive && (
        <button
          onClick={() => onSubscribe(plan)}
          className={`w-full py-3 px-4 rounded-xl font-bold transition-all ${
            plan.type === 'professional'
              ? 'bg-neutral-900 hover:bg-black text-white'
              : 'bg-primary-600 hover:bg-primary-700 text-white'
          }`}
        >
          {t('plan.subscribe') || 'Subscribe Now'}
        </button>
      )}
    </div>
  );
}
