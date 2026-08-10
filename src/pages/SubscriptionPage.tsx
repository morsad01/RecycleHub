import { useSubscription } from '../features/monetization/hooks/useSubscription';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export function SubscriptionPage() {
  const { subscription, cancel, isLoading } = useSubscription();
  const { user } = useAuth();
  const { t } = useI18n();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-neutral-900 mb-8">My Subscription</h1>
      
      {!subscription ? (
        <div className="bg-white rounded-2xl p-8 border border-neutral-200 text-center">
          <div className="w-16 h-16 bg-neutral-100 text-neutral-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">No Active Subscription</h2>
          <p className="text-neutral-600 mb-6">You are currently on the default free tier. Upgrade to unlock more features.</p>
          <Link to="/pricing" className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors">
            View Plans
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="p-8 border-b border-neutral-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-neutral-900">{subscription.plan?.name} Plan</h2>
                <p className="text-neutral-500 capitalize">{subscription.billing_cycle} billing</p>
              </div>
              <div className="px-4 py-1.5 bg-success-50 text-success-700 rounded-full font-medium text-sm flex items-center gap-2">
                <CheckCircle2 size={16} /> Active
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                <p className="text-sm text-neutral-500 mb-1">Current Period Start</p>
                <p className="font-semibold text-neutral-900">{new Date(subscription.current_period_start).toLocaleDateString()}</p>
              </div>
              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                <p className="text-sm text-neutral-500 mb-1">Current Period End</p>
                <p className="font-semibold text-neutral-900">{new Date(subscription.current_period_end).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
          
          <div className="p-8 bg-neutral-50">
            {subscription.cancel_at_period_end ? (
              <div className="flex items-start gap-4 p-4 bg-error-50 text-error-800 rounded-xl border border-error-200">
                <AlertTriangle size={24} className="shrink-0" />
                <div>
                  <h4 className="font-bold">Subscription Canceling</h4>
                  <p className="text-sm mt-1">Your subscription will end on {new Date(subscription.current_period_end).toLocaleDateString()}. You will not be billed again.</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-neutral-600">
                  Your plan will automatically renew on {new Date(subscription.current_period_end).toLocaleDateString()}.
                </p>
                <button
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to cancel your subscription?')) {
                      await cancel();
                    }
                  }}
                  className="px-6 py-2.5 bg-white border border-error-200 text-error-600 rounded-xl font-bold hover:bg-error-50 transition-colors w-full sm:w-auto"
                >
                  Cancel Subscription
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
