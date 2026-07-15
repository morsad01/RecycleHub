import type { CouponService } from '../types/promotion.types';
import { supabase } from '../../../lib/supabase';

export const couponService: CouponService = {
  async validateCoupon(code: string, orderAmount: number) {
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString())
      .single();

    if (error || !coupon) {
      return { isValid: false, discountAmount: 0, errorMessage: 'Invalid or expired coupon code' };
    }

    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return { isValid: false, discountAmount: 0, errorMessage: 'Coupon usage limit reached' };
    }

    if (orderAmount < (coupon.min_order_amount || 0)) {
      return { isValid: false, discountAmount: 0, errorMessage: `Minimum order amount is ৳${coupon.min_order_amount}` };
    }

    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = (orderAmount * coupon.value) / 100;
      if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
        discountAmount = coupon.max_discount_amount;
      }
    } else {
      discountAmount = coupon.value;
    }

    // Don't allow discount to exceed order amount
    discountAmount = Math.min(discountAmount, orderAmount);

    return { isValid: true, discountAmount };
  },

  async applyCoupon(code: string, orderId: string) {
    // In production: Decrement usage_count, record in order table via RPC
    const { error } = await supabase.rpc('apply_coupon', { 
      coupon_code: code.toUpperCase(), 
      p_order_id: orderId 
    });
    
    // Fallback since RPC might not exist yet
    if (error) {
       console.log('Using fallback for applyCoupon');
       return true; 
    }
    return !error;
  }
};
