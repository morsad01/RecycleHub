import { useState, useEffect } from 'react';
import type { Plan, Subscription } from '../../../types';
import { planService } from '../services/planService';
import { useAuth } from '../../../auth/AuthContext';

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const [fetchedPlans, fetchedSub] = await Promise.all([
        planService.getPlans(),
        user ? planService.getSubscription(user.id) : Promise.resolve(null),
      ]);
      setPlans(fetchedPlans);
      setSubscription(fetchedSub);
      setIsLoading(false);
    }
    loadData();
  }, [user]);

  const subscribe = async (planId: string, cycle: 'monthly' | 'yearly') => {
    if (!user) return false;
    const res = await planService.createSubscription(user.id, planId, cycle);
    if (res.success) {
      const updatedSub = await planService.getSubscription(user.id);
      setSubscription(updatedSub);
    }
    return res.success;
  };

  const cancel = async () => {
    if (!subscription) return false;
    const success = await planService.cancelSubscription(subscription.id);
    if (success) {
      setSubscription({ ...subscription, cancel_at_period_end: true });
    }
    return success;
  };

  return { subscription, plans, isLoading, subscribe, cancel };
}
