import { useState } from 'react';
import type { PaymentProvider, PaymentRequest, PaymentResult } from '../types/payment.types';
import { PaymentGateway } from '../services/paymentService';

export function usePayment() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiatePayment = async (provider: PaymentProvider, request: PaymentRequest): Promise<PaymentResult | null> => {
    setIsProcessing(true);
    setError(null);
    try {
      const result = await PaymentGateway.initiate(provider, request);
      if (!result.success) {
        setError(result.errorMessage || 'Payment initiation failed');
      }
      return result;
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during payment');
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const verifyPayment = async (provider: PaymentProvider, transactionId: string): Promise<boolean> => {
    setIsProcessing(true);
    setError(null);
    try {
      return await PaymentGateway.verify(provider, transactionId);
    } catch (err: any) {
      setError(err.message || 'Payment verification failed');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    error,
    initiatePayment,
    verifyPayment,
  };
}
