import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, Sparkles, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button, Input } from '../ui';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../ui/Toast';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../lib/utils';
import type { ProductWithRelations } from '../../types';

interface MakeOfferModalProps {
  open: boolean;
  onClose: () => void;
  product: ProductWithRelations;
}

export function MakeOfferModal({ open, onClose, product }: MakeOfferModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [offerAmount, setOfferAmount] = useState<string>(
    Math.round(product.price * 0.9).toString()
  );
  const [note, setNote] = useState<string>('Hi! Would you accept this offer for a quick pickup/delivery?');
  const [submitting, setSubmitting] = useState(false);
  const [submittedOffer, setSubmittedOffer] = useState<boolean>(false);

  const numOffer = parseFloat(offerAmount) || 0;
  const discountPercent = product.price > 0 
    ? Math.round(((product.price - numOffer) / product.price) * 100)
    : 0;

  // AI Negotiation Intelligence feedback
  const getAiAdvisorFeedback = () => {
    if (!numOffer || numOffer <= 0) return null;
    if (numOffer >= product.price) {
      return {
        variant: 'info' as const,
        text: 'This offer is equal to or above the asking price. Consider proceeding directly with "Buy Now" or standard checkout.',
        tier: 'Full Price'
      };
    }
    if (discountPercent <= 10) {
      return {
        variant: 'success' as const,
        text: `Strong Offer (${discountPercent}% off). Within typical seller acceptance range in Bangladesh. High likelihood of rapid approval.`,
        tier: 'High Likelihood'
      };
    }
    if (discountPercent <= 20) {
      return {
        variant: 'warning' as const,
        text: `Fair Negotiation (${discountPercent}% off). A standard bargaining margin for second-hand items. Seller may accept or counter-offer.`,
        tier: 'Moderate Likelihood'
      };
    }
    return {
      variant: 'danger' as const,
      text: `Aggressive Offer (${discountPercent}% off). Significant discount below market value. The seller may decline or perceive it as a lowball offer.`,
      tier: 'Low Likelihood'
    };
  };

  const aiFeedback = getAiAdvisorFeedback();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast('Please login to make an offer', 'error');
      navigate('/login');
      return;
    }

    if (user.id === product.seller_id) {
      toast('You cannot make an offer on your own listing', 'error');
      return;
    }

    if (numOffer <= 0) {
      toast('Please enter a valid offer amount', 'error');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Get or create conversation with seller
      let conversationId = '';
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('product_id', product.id)
        .eq('buyer_id', user.id)
        .eq('seller_id', product.seller_id)
        .maybeSingle();

      if (existingConv) {
        conversationId = existingConv.id;
      } else {
        const { data: newConv, error: convErr } = await supabase
          .from('conversations')
          .insert({
            product_id: product.id,
            buyer_id: user.id,
            seller_id: product.seller_id,
            last_message_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (convErr) throw convErr;
        conversationId = newConv.id;
      }

      // 2. Send formatted offer message in chat
      const offerMessage = `🏷️ **OFFER SUBMITTED: ${formatPrice(numOffer)}** (${discountPercent > 0 ? `${discountPercent}% below asking ৳${product.price.toLocaleString()}` : 'full asking price'})\n\n"${note}"`;

      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: offerMessage
      });

      // 3. Notify seller
      await supabase.from('notifications').insert({
        user_id: product.seller_id,
        type: 'offer',
        title: `New Offer on ${product.title}`,
        message: `A buyer offered ${formatPrice(numOffer)} for "${product.title}". Review in messages to accept or counter.`,
        link: `/messages/${conversationId}`
      });

      setSubmittedOffer(true);
      toast('Offer sent to seller successfully!', 'success');
    } catch (err: any) {
      toast('Failed to submit offer: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        setSubmittedOffer(false);
        onClose();
      }}
      title="Make a Price Offer"
    >
      {!submittedOffer ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Summary Header */}
          <div className="flex gap-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-100 items-center">
            {product.product_images?.[0]?.url && (
              <img
                src={product.product_images[0].url}
                alt={product.title}
                className="w-14 h-14 rounded-xl object-cover border border-neutral-200"
              />
            )}
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-xs text-neutral-900 line-clamp-1">{product.title}</h4>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-sm font-bold text-neutral-900">Asking: {formatPrice(product.price)}</span>
                {product.ai_suggested_price && (
                  <span className="text-2xs text-neutral-500">
                    Est. Market: {formatPrice(product.ai_suggested_price)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Offer Input */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Your Offer Amount (৳ BDT)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 font-bold text-sm">৳</span>
              <input
                type="number"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                min="100"
                step="50"
                className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-neutral-300 font-bold text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                placeholder="Enter your offer price..."
                required
              />
            </div>
            {discountPercent > 0 && (
              <p className="text-2xs text-neutral-500 mt-1">
                You save <strong>{formatPrice(product.price - numOffer)}</strong> ({discountPercent}% discount)
              </p>
            )}
          </div>

          {/* AI Negotiation Advisor */}
          {aiFeedback && (
            <div className={`p-3 rounded-xl text-2xs space-y-1 border ${
              aiFeedback.variant === 'success'
                ? 'bg-success-50/70 border-success-200 text-success-900'
                : aiFeedback.variant === 'warning'
                ? 'bg-warning-50/70 border-warning-200 text-warning-900'
                : aiFeedback.variant === 'danger'
                ? 'bg-error-50/70 border-error-200 text-error-900'
                : 'bg-primary-50/70 border-primary-200 text-primary-900'
            }`}>
              <div className="flex items-center gap-1.5 font-bold">
                <Sparkles size={12} className="text-primary-600 shrink-0" />
                <span>AI Negotiation Advisor: {aiFeedback.tier}</span>
              </div>
              <p className="leading-relaxed opacity-90">{aiFeedback.text}</p>
            </div>
          )}

          {/* Note to Seller */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Message to Seller (Optional)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a polite note to increase offer acceptance..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>

          {/* Safety Reminder */}
          <div className="flex items-start gap-2 p-2.5 bg-neutral-50 rounded-xl text-3xs text-neutral-500 border border-neutral-100">
            <AlertCircle size={13} className="text-neutral-400 shrink-0 mt-0.5" />
            <p>
              Offers are non-binding bargaining inquiries. Once accepted, you can coordinate safe meetup or complete checkout securely.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" type="submit" loading={submitting} className="font-semibold">
              <Tag size={14} className="mr-1" /> Send Offer ({formatPrice(numOffer)})
            </Button>
          </div>
        </form>
      ) : (
        <div className="text-center py-6 space-y-4">
          <div className="w-12 h-12 rounded-full bg-success-100 text-success-600 flex items-center justify-center mx-auto">
            <CheckCircle2 size={28} />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-900">Offer Sent to Seller!</h3>
            <p className="text-xs text-neutral-500 max-w-xs mx-auto mt-1">
              Your offer of <strong>{formatPrice(numOffer)}</strong> has been delivered to the seller's inbox.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Continue Browsing
            </Button>
            <Button size="sm" onClick={() => navigate('/messages')} className="flex items-center gap-1">
              Open Chat <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
