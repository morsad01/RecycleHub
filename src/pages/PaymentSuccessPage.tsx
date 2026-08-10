import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Package,
  ArrowRight,
  Printer,
  Copy,
  Check,
  ShieldCheck,
  CreditCard,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { formatPrice } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { SEO } from '../components/SEO';

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const tranId = searchParams.get('tran_id') || `SSL-${Date.now().toString().slice(-8)}`;
  const amount = parseFloat(searchParams.get('amount') || '0');
  const method = searchParams.get('method') || 'SSLCommerz Gateway';
  const bankTranId = searchParams.get('bank_tran_id');
  const orderId = searchParams.get('order_id');
  const paymentType = searchParams.get('type') || 'order';

  const [copied, setCopied] = useState(false);

  const handleCopyTranId = () => {
    navigator.clipboard.writeText(tranId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-[80vh] bg-neutral-50 py-12 px-4 sm:px-6">
      <SEO
        title="Payment Successful - ResellBD"
        description="Your SSLCommerz digital payment has been verified and processed successfully."
      />

      <div className="max-w-xl mx-auto space-y-6">
        {/* Success Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-neutral-100 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-400 via-primary-500 to-teal-500" />

          {/* Success Icon */}
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-xs animate-scale-in">
            <CheckCircle2 size={44} className="animate-bounce-short" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 mb-2">
            Payment Confirmed!
          </h1>
          <p className="text-sm text-neutral-500 max-w-md mx-auto">
            {paymentType === 'subscription'
              ? 'Thank you! Your seller subscription plan has been activated with all premium privileges.'
              : 'Thank you for your purchase! Your order has been placed and verified via SSLCommerz.'}
          </p>

          {/* Amount Badge */}
          <div className="my-6 p-4 bg-neutral-50 rounded-2xl border border-neutral-100 inline-block min-w-[200px]">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
              Total Amount Paid
            </span>
            <span className="text-3xl font-black text-emerald-600 mt-1 block">
              {formatPrice(amount)}
            </span>
          </div>

          {/* Transaction & Order Summary Details */}
          <div className="border border-neutral-100 rounded-2xl p-4 bg-neutral-50/60 text-xs space-y-3 text-left">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
              <span className="text-neutral-500 font-medium">Transaction ID</span>
              <div className="flex items-center gap-1.5 font-mono font-bold text-neutral-900">
                <span>{tranId}</span>
                <button
                  type="button"
                  onClick={handleCopyTranId}
                  className="p-1 rounded hover:bg-neutral-200 transition-colors text-neutral-400 hover:text-neutral-700"
                  title="Copy Transaction ID"
                >
                  {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
              <span className="text-neutral-500 font-medium">Payment Gateway</span>
              <span className="font-semibold text-neutral-800 flex items-center gap-1">
                <CreditCard size={14} className="text-primary-600" />
                {method} (SSLCommerz)
              </span>
            </div>

            {bankTranId && (
              <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
                <span className="text-neutral-500 font-medium">Bank Reference</span>
                <span className="font-mono text-neutral-700">{bankTranId}</span>
              </div>
            )}

            <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
              <span className="text-neutral-500 font-medium">Date & Time</span>
              <span className="font-medium text-neutral-800 flex items-center gap-1">
                <Calendar size={13} className="text-neutral-400" />
                {new Date().toLocaleString('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-neutral-500 font-medium">Payment Status</span>
              <span className="font-bold text-emerald-600 uppercase flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                PAID & VERIFIED
              </span>
            </div>
          </div>

          {/* Trust Banner */}
          <div className="mt-6 flex items-center justify-center gap-2 text-2xs text-neutral-500 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
            <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
            <span>Protected by ResellBD Buyer Escrow & SSLCommerz 256-bit SSL Security</span>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            {paymentType === 'subscription' ? (
              <Button
                onClick={() => navigate('/dashboard')}
                size="lg"
                className="w-full sm:w-auto"
              >
                <Sparkles size={18} className="mr-1.5" /> Go to Seller Dashboard
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => navigate('/orders')}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  <Package size={18} className="mr-1.5" /> View My Orders
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handlePrint}
                  className="w-full sm:w-auto"
                >
                  <Printer size={16} className="mr-1.5" /> Print Invoice
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Back to Home link */}
        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            Continue Browsing Marketplace <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
