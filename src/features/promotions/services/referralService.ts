import type { ReferralService } from '../types/promotion.types';
import { supabase } from '../../../lib/supabase';
import type { ReferralCode } from '../../../types';

export const referralService: ReferralService = {
  async getUserReferralCode(userId: string) {
    const { data, error } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') return null;
    return data as ReferralCode | null;
  },

  async generateReferralCode(userId: string) {
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data, error } = await supabase
      .from('referral_codes')
      .insert({
        user_id: userId,
        code: `RH${randomCode}`,
        reward_amount: 50, // default reward
      })
      .select()
      .single();

    if (error) return null;
    return data as ReferralCode;
  },

  async applyReferralCode(code: string, newUserId: string) {
    const { data: refCode, error } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error || !refCode) {
      return { success: false, errorMessage: 'Invalid referral code' };
    }

    if (refCode.user_id === newUserId) {
      return { success: false, errorMessage: 'You cannot use your own referral code' };
    }

    // In production: Record referral, add reward balance to referrer via RPC
    return { success: true, rewardAmount: refCode.reward_amount };
  }
};
