import type { PaymentService, PaymentRequest, PaymentResult } from '../types/payment.types';

export const bkashService: PaymentService = {
  provider: 'bkash',
  
  async initiatePayment(request: PaymentRequest): Promise<PaymentResult> {
    // In production, this would call a backend Supabase Edge Function to initiate the bKash checkout
    console.log(`Initiating bKash payment for order ${request.orderId}, amount: ${request.amount}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate returning a redirect URL to the bKash payment gateway
    return {
      success: true,
      redirectUrl: `/checkout?provider=bkash&session=${request.orderId}_mock_session`
    };
  },

  async verifyPayment(transactionId: string): Promise<boolean> {
    // In production, this would call bKash verification API via backend
    await new Promise(resolve => setTimeout(resolve, 500));
    return true; // Simulate success
  }
};
