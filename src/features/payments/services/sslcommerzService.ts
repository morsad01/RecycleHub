import type { PaymentService, PaymentRequest, PaymentResult } from '../types/payment.types';

export const sslcommerzService: PaymentService = {
  provider: 'sslcommerz',
  
  async initiatePayment(request: PaymentRequest): Promise<PaymentResult> {
    console.log(`Initiating SSLCommerz payment for order ${request.orderId}, amount: ${request.amount}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      redirectUrl: `/checkout?provider=sslcommerz&session=${request.orderId}_mock_session`
    };
  },

  async verifyPayment(transactionId: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  }
};
