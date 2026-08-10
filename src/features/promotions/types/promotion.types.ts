import type { Coupon, ReferralCode, Campaign } from '../../../types';

export interface CouponService {
  validateCoupon(code: string, orderAmount: number): Promise<{ isValid: boolean; discountAmount: number; errorMessage?: string }>;
  applyCoupon(code: string, orderId: string): Promise<boolean>;
}

export interface ReferralService {
  getUserReferralCode(userId: string): Promise<ReferralCode | null>;
  generateReferralCode(userId: string): Promise<ReferralCode | null>;
  applyReferralCode(code: string, newUserId: string): Promise<{ success: boolean; rewardAmount?: number; errorMessage?: string }>;
}
