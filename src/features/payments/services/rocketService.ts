import type { PaymentService, PaymentRequest, PaymentResult } from '../types/payment.types';

export const rocketService: PaymentService = {
  provider: 'rocket',
  
  async initiatePayment(request: PaymentRequest): Promise<PaymentResult> {
    console.log(`Initiating Rocket payment for order ${request.orderId}, amount: ${request.amount}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      redirectUrl: `/checkout?provider=rocket&session=${request.orderId}_mock_session`
    };
  },

  async verifyPayment(transactionId: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  }
};
