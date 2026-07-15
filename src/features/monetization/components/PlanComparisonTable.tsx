import { Check, Minus } from 'lucide-react';
import type { Plan } from '../../../types';

interface PlanComparisonTableProps {
  plans: Plan[];
}

export function PlanComparisonTable({ plans }: PlanComparisonTableProps) {
  const features = [
    { name: 'Maximum active listings', key: 'max_products' },
    { name: 'Featured listings per month', key: 'featured_listings_count' },
    { name: 'AI auto-fill uses per month', key: 'ai_usage_limit' },
    { name: 'Advanced store analytics', key: 'has_analytics', type: 'boolean' },
    { name: 'Priority customer support', key: 'has_priority_support', type: 'boolean' },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr>
            <th className="p-4 border-b border-neutral-200 bg-neutral-50 w-1/4">Features</th>
            {plans.map((plan) => (
              <th key={plan.id} className="p-4 border-b border-neutral-200 bg-neutral-50 font-bold text-center w-[15%]">
                {plan.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map((feature, i) => (
            <tr key={i} className="hover:bg-neutral-50/50 transition-colors">
              <td className="p-4 border-b border-neutral-100 font-medium text-neutral-700">{feature.name}</td>
              {plans.map((plan) => {
                const value = (plan as any)[feature.key];
                return (
                  <td key={plan.id} className="p-4 border-b border-neutral-100 text-center text-neutral-600">
                    {feature.type === 'boolean' ? (
                      value ? <Check size={18} className="mx-auto text-primary-600" /> : <Minus size={18} className="mx-auto text-neutral-300" />
                    ) : value === -1 ? (
                      'Unlimited'
                    ) : (
                      value
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
