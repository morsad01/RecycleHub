import type { Plan, PlanType, Subscription, FeaturedListing } from '../../../types';

export interface PlanService {
  getPlans(): Promise<Plan[]>;
  getSubscription(userId: string): Promise<Subscription | null>;
  createSubscription(userId: string, planId: string, cycle: 'monthly' | 'yearly'): Promise<{ success: boolean; redirectUrl?: string }>;
  cancelSubscription(subscriptionId: string): Promise<boolean>;
  getFeaturedListings(userId: string): Promise<FeaturedListing[]>;
  purchaseFeaturedListing(productId: string, userId: string, type: FeaturedListing['type']): Promise<boolean>;
}
