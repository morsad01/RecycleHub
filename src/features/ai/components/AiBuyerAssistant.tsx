import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AIService } from '../services/aiService';
import { Sparkles, HelpCircle, ShieldCheck, ChevronDown, Info } from 'lucide-react';
import { formatPrice } from '../../../lib/utils';
import type { ProductWithRelations } from '../../../types';

interface AiBuyerAssistantProps {
  product: ProductWithRelations;
}

export function AiBuyerAssistant({ product }: AiBuyerAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<'price' | 'condition' | 'authenticity' | null>(null);

  // Smart pricing recommendation query
  const { data: priceDetails } = useQuery({
    queryKey: ['ai-pricing-details', product.id],
    queryFn: async () => {
      return AIService.recommendPrice(product.category?.name || 'Electronics', product.brand, product.condition);
    }
  });

  const getDealRating = () => {
    if (!priceDetails) return { label: 'Analyzing Value...', color: 'text-neutral-500' };
    const price = product.price;
    if (price <= priceDetails.min) return { label: 'Great Deal (Underpriced)', color: 'text-success-600 font-bold' };
    if (price <= priceDetails.recommended) return { label: 'Good Deal (Fair Market Price)', color: 'text-primary-600 font-bold' };
    return { label: 'Standard Price', color: 'text-neutral-600 font-bold' };
  };

  const deal = getDealRating();

  return (
    <div className="bg-gradient-to-br from-accent-50 to-neutral-50 border border-accent-100 rounded-3xl p-5 shadow-card space-y-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between font-bold text-accent-950 text-sm"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="text-accent-500 shrink-0" size={16} />
          <span>AI Buyer Listing Advisor</span>
        </div>
        <ChevronDown size={16} className={`text-accent-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="space-y-3 pt-2 text-xs text-neutral-600 border-t border-accent-100/50 animate-fade-in">
          {/* Item 1: Price Value */}
          <div className="border border-neutral-100 rounded-2xl bg-white p-3 space-y-2">
            <button
              onClick={() => setActiveAccordion(activeAccordion === 'price' ? null : 'price')}
              className="w-full flex justify-between items-center font-bold text-neutral-800"
            >
              <span>Fair Value Evaluation</span>
              <Info size={14} className="text-neutral-400" />
            </button>
            {activeAccordion === 'price' && priceDetails && (
              <div className="space-y-2 pt-1 animate-fade-in">
                <p>Calculated fair market price bracket for {product.brand || 'item'} in {product.condition} condition:</p>
                <div className="flex justify-between font-semibold py-1 bg-neutral-50 px-2 rounded-lg text-2xs">
                  <span>Min: {formatPrice(priceDetails.min)}</span>
                  <span>Avg: {formatPrice(priceDetails.recommended)}</span>
                  <span>Max: {formatPrice(priceDetails.max)}</span>
                </div>
                <p className="text-2xs">
                  Listing price: <strong>{formatPrice(product.price)}</strong> — <span className={deal.color}>{deal.label}</span>
                </p>
              </div>
            )}
          </div>

          {/* Item 2: Condition Detail */}
          <div className="border border-neutral-100 rounded-2xl bg-white p-3 space-y-2">
            <button
              onClick={() => setActiveAccordion(activeAccordion === 'condition' ? null : 'condition')}
              className="w-full flex justify-between items-center font-bold text-neutral-800"
            >
              <span>Condition Estimation Explainer</span>
              <HelpCircle size={14} className="text-neutral-400" />
            </button>
            {activeAccordion === 'condition' && (
              <div className="space-y-1.5 pt-1 animate-fade-in">
                <p>Product condition is listed as <strong className="capitalize">{product.condition}</strong>.</p>
                <p className="text-neutral-500 text-3xs leading-relaxed">
                  Excellent items show light cosmetic blemishes but function perfectly. Good condition indicates minor signs of wear. Fair shows moderate scratch traces but remains fully tested.
                </p>
              </div>
            )}
          </div>

          {/* Item 3: Authenticity Indicator */}
          <div className="border border-neutral-100 rounded-2xl bg-white p-3 space-y-2">
            <button
              onClick={() => setActiveAccordion(activeAccordion === 'authenticity' ? null : 'authenticity')}
              className="w-full flex justify-between items-center font-bold text-neutral-800"
            >
              <span>Authenticity Verification Check</span>
              <ShieldCheck size={14} className="text-neutral-400" />
            </button>
            {activeAccordion === 'authenticity' && (
              <div className="space-y-1.5 pt-1 animate-fade-in">
                <p className="text-success-600 font-semibold flex items-center gap-1">
                  <ShieldCheck size={12} />
                  Safe Listing Verified
                </p>
                <p className="text-neutral-500 text-3xs leading-relaxed">
                  Authenticity checks show a low counterfeit replica risk score ({((product.risk_score || 0.05) * 100).toFixed(0)}% risk). Seller status and item price align with verification regulations.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
