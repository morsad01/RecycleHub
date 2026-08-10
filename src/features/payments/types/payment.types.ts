export type PaymentProvider = 'cod' | 'sslcommerz' | 'bkash' | 'nagad' | 'rocket' | 'stripe';

export interface PaymentRequest {
  orderId: string;
  amount: number;
  currency: 'BDT' | 'USD';
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  redirectUrl?: string;
  errorMessage?: string;
}

export interface PaymentService {
  provider: PaymentProvider;
  initiatePayment(request: PaymentRequest): Promise<PaymentResult>;
  verifyPayment(transactionId: string): Promise<boolean>;
  refundPayment?(transactionId: string, amount: number): Promise<PaymentResult>;
}
