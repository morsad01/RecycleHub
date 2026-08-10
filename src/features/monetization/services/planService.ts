import type { Plan, Subscription, FeaturedListing } from '../../../types';
import type { PlanService } from '../types/plan.types';
import { supabase } from '../../../lib/supabase';

export const planService: PlanService = {
  async getPlans(): Promise<Plan[]> {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true });
      
    if (error) {
      console.error('Error fetching plans:', error);
      return [];
    }
    return data as Plan[];
  },

  async getSubscription(userId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, plan:plans(*)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();
      
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching subscription:', error);
      return null;
    }
    return data as Subscription | null;
  },

  async createSubscription(userId: string, planId: string, cycle: 'monthly' | 'yearly') {
    // In production, this would integrate with payment gateway for recurring billing.
    // For now, simulate direct insert to database.
    const endDate = new Date();
    if (cycle === 'monthly') endDate.setMonth(endDate.getMonth() + 1);
    else endDate.setFullYear(endDate.getFullYear() + 1);

    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_id: planId,
        status: 'active',
        billing_cycle: cycle,
        current_period_start: new Date().toISOString(),
        current_period_end: endDate.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating subscription:', error);
      return { success: false };
    }
    return { success: true };
  },

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    const { error } = await supabase
      .from('subscriptions')
      .update({ cancel_at_period_end: true })
      .eq('id', subscriptionId);
      
    if (error) {
      console.error('Error canceling subscription:', error);
      return false;
    }
    return true;
  },

  async getFeaturedListings(userId: string): Promise<FeaturedListing[]> {
    const { data, error } = await supabase
      .from('featured_listings')
      .select('*')
      .eq('user_id', userId)
      .gte('end_date', new Date().toISOString());
      
    if (error) return [];
    return data as FeaturedListing[];
  },

  async purchaseFeaturedListing(productId: string, userId: string, type: FeaturedListing['type']): Promise<boolean> {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7); // Default 7 days
    
    const { error } = await supabase
      .from('featured_listings')
      .insert({
        product_id: productId,
        user_id: userId,
        type,
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString(),
      });
      
    return !error;
  }
};
