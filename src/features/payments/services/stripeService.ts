import type { PaymentService, PaymentRequest, PaymentResult } from '../types/payment.types';

export const stripeService: PaymentService = {
  provider: 'stripe',
  
  async initiatePayment(request: PaymentRequest): Promise<PaymentResult> {
    console.log(`Initiating Stripe payment for order ${request.orderId}, amount: ${request.amount}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      redirectUrl: `/checkout?provider=stripe&session=${request.orderId}_mock_session`
    };
  },

  async verifyPayment(transactionId: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  },

  async refundPayment(transactionId: string, amount: number): Promise<PaymentResult> {
    console.log(`Refunding Stripe payment ${transactionId}, amount: ${amount}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  }
};
