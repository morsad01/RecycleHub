import type { PaymentService, PaymentRequest, PaymentResult } from '../types/payment.types';

export const codService: PaymentService = {
  provider: 'cod',
  
  async initiatePayment(request: PaymentRequest): Promise<PaymentResult> {
    // For COD, we just mark it successful immediately without redirecting
    return {
      success: true,
      transactionId: `COD_${request.orderId}_${Date.now()}`
    };
  },

  async verifyPayment(transactionId: string): Promise<boolean> {
    return true;
  }
};
