import type { PaymentService, PaymentRequest, PaymentResult } from '../types/payment.types';

export const nagadService: PaymentService = {
  provider: 'nagad',
  
  async initiatePayment(request: PaymentRequest): Promise<PaymentResult> {
    console.log(`Initiating Nagad payment for order ${request.orderId}, amount: ${request.amount}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      redirectUrl: `/checkout?provider=nagad&session=${request.orderId}_mock_session`
    };
  },

  async verifyPayment(transactionId: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  }
};
