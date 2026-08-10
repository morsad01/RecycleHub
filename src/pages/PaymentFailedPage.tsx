import { useSearchParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { XCircle, AlertTriangle, RefreshCw, ArrowLeft, HelpCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { SEO } from '../components/SEO';

interface PaymentFailedPageProps {
  status?: 'failed' | 'cancelled';
}

export function PaymentFailedPage({ status: propStatus }: PaymentFailedPageProps) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const isCancel = propStatus === 'cancelled' || location.pathname.includes('/cancel');
  const tranId = searchParams.get('tran_id');
  const reason = searchParams.get('reason');

  return (
    <div className="min-h-[75vh] bg-neutral-50 py-16 px-4 sm:px-6 flex items-center justify-center">
      <SEO
        title={isCancel ? 'Payment Cancelled - ResellBD' : 'Payment Failed - ResellBD'}
        description="Status update regarding your payment attempt."
      />

      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-sm border border-neutral-100 text-center">
        {/* Status Icon */}
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
            isCancel
              ? 'bg-amber-50 text-amber-600'
              : 'bg-error-50 text-error-600'
          }`}
        >
          {isCancel ? <AlertTriangle size={42} /> : <XCircle size={42} />}
        </div>

        <h1 className="text-2xl font-black text-neutral-900 mb-2">
          {isCancel ? 'Payment Cancelled' : 'Payment Could Not Be Processed'}
        </h1>

        <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
          {isCancel
            ? 'You have cancelled the SSLCommerz payment process. No charges have been made to your account.'
            : reason || 'Your transaction was declined or could not be completed by the payment provider. Please try again or use another payment method.'}
        </p>

        {tranId && (
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 text-xs text-neutral-600 mb-6">
            <span className="font-semibold text-neutral-400 block text-2xs uppercase">Reference ID</span>
            <span className="font-mono font-bold text-neutral-800">{tranId}</span>
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={() => navigate('/checkout')}
            size="lg"
            className="w-full"
          >
            <RefreshCw size={16} className="mr-1.5" /> Return to Checkout & Retry
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate('/cart')}
            size="lg"
            className="w-full"
          >
            <ArrowLeft size={16} className="mr-1.5" /> View Cart
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-neutral-100 flex items-center justify-center gap-2 text-xs text-neutral-500">
          <HelpCircle size={15} className="text-neutral-400" />
          <span>Need assistance? Contact our</span>
          <Link to="/support" className="font-semibold text-primary-600 hover:underline">
            Support Center
          </Link>
        </div>
      </div>
    </div>
  );
}
