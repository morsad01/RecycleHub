import type { PaymentProvider, PaymentRequest, PaymentResult, PaymentService } from '../types/payment.types';
import { bkashService } from './bkashService';
import { nagadService } from './nagadService';
import { rocketService } from './rocketService';
import { sslcommerzService } from './sslcommerzService';
import { stripeService } from './stripeService';
import { codService } from './codService';

const providers: Record<PaymentProvider, PaymentService> = {
  bkash: bkashService,
  nagad: nagadService,
  rocket: rocketService,
  sslcommerz: sslcommerzService,
  stripe: stripeService,
  cod: codService,
};

export class PaymentGateway {
  static async initiate(provider: PaymentProvider, request: PaymentRequest): Promise<PaymentResult> {
    const service = providers[provider];
    if (!service) {
      return { success: false, errorMessage: `Payment provider ${provider} not supported.` };
    }
    
    try {
      return await service.initiatePayment(request);
    } catch (error: any) {
      console.error(`Payment initiation failed for ${provider}:`, error);
      return { success: false, errorMessage: error.message || 'Payment initiation failed' };
    }
  }

  static async verify(provider: PaymentProvider, transactionId: string): Promise<boolean> {
    const service = providers[provider];
    if (!service) return false;
    
    try {
      return await service.verifyPayment(transactionId);
    } catch (error) {
      console.error(`Payment verification failed for ${provider}:`, error);
      return false;
    }
  }

  static async refund(provider: PaymentProvider, transactionId: string, amount: number): Promise<PaymentResult> {
    const service = providers[provider];
    if (!service || !service.refundPayment) {
      return { success: false, errorMessage: `Refund not supported for ${provider}` };
    }
    
    try {
      return await service.refundPayment(transactionId, amount);
    } catch (error: any) {
      console.error(`Refund failed for ${provider}:`, error);
      return { success: false, errorMessage: error.message || 'Refund failed' };
    }
  }
}
