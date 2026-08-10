import { useState } from 'react';
import { PlanCard } from '../features/monetization/components/PlanCard';
import { useSubscription } from '../features/monetization/hooks/useSubscription';
import { useI18n } from '../i18n/I18nContext';
import { useAuth } from '../auth/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export function PricingPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { plans, subscription, isLoading, subscribe } = useSubscription();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(null);

  const handleSubscribe = async (plan: any) => {
    if (!user) {
      navigate('/login?redirect=/pricing');
      return;
    }

    const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;

    // If free plan, activate directly
    if (price === 0) {
      const success = await subscribe(plan.id, billingCycle);
      if (success) {
        navigate('/dashboard');
      }
      return;
    }

    // For paid plans, redirect to SSLCommerz
    setSubscribingPlanId(plan.id);
    try {
      const { SSLCommerzService } = await import('../services/sslcommerz');
      const res = await SSLCommerzService.initiateSubscriptionPayment({
        user_id: user.id,
        plan_id: plan.id,
        billing_cycle: billingCycle,
        total_amount: price,
        cus_name: user.user_metadata?.full_name || 'Seller',
        cus_email: user.email || 'seller@resellbd.app',
        plan_name: plan.name,
      });

      if (res.gateway_url) {
        window.location.href = res.gateway_url;
      }
    } catch (err: any) {
      console.error('Subscription SSL error:', err);
      alert(err.message || 'Failed to start payment. Please ensure backend server is running.');
    } finally {
      setSubscribingPlanId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <main className="min-h-screen pt-32 pb-20 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6">
            {t('plan.pricingTitle') || 'Seller Subscription Plans'}
          </h1>
          <p className="text-xl text-neutral-600">
            {t('plan.pricingSubtitle') || 'Choose the right plan to grow your resale business.'}
          </p>

          <div className="mt-10 inline-flex bg-neutral-200 p-1 rounded-xl">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                billingCycle === 'monthly' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {t('plan.monthly') || 'Monthly'}
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                billingCycle === 'yearly' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {t('plan.yearly') || 'Yearly (Save 20%)'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              billingCycle={billingCycle}
              isActive={subscription?.plan_id === plan.id}
              onSubscribe={handleSubscribe}
            />
          ))}
        </div>
        
        {!plans.length && (
          <div className="text-center py-20 bg-white rounded-2xl border border-neutral-200">
            <p className="text-neutral-500">No plans available at the moment. Please check back later.</p>
          </div>
        )}
      </div>
    </main>
  );
}
