/**
 * SSLCommerz Payment Gateway Service
 * Handles session initiation, redirection, and transaction verification.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface SSLOrderPaymentPayload {
  order_ids: string[];
  user_id: string;
  total_amount: number;
  cus_name: string;
  cus_email: string;
  cus_phone: string;
  cus_add1?: string;
  cus_city?: string;
  product_name?: string;
  product_category?: string;
}

export interface SSLSubscriptionPaymentPayload {
  user_id: string;
  plan_id: string;
  billing_cycle: 'monthly' | 'yearly';
  total_amount: number;
  cus_name: string;
  cus_email: string;
  cus_phone?: string;
  plan_name?: string;
}

export class SSLCommerzService {
  /**
   * Initiate SSLCommerz checkout payment for cart orders
   */
  static async initiateOrderPayment(payload: SSLOrderPaymentPayload): Promise<{ gateway_url: string; tran_id: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sslcommerz/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          type: 'order',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.gateway_url) {
        throw new Error(data.error || 'Failed to initialize SSLCommerz gateway session.');
      }

      return {
        gateway_url: data.gateway_url,
        tran_id: data.tran_id,
      };
    } catch (err: any) {
      console.error('[SSLCommerz Client Error]:', err);
      throw new Error(err.message || 'Unable to connect to payment server. Please ensure backend server is running.');
    }
  }

  /**
   * Initiate SSLCommerz payment for subscription plan upgrade
   */
  static async initiateSubscriptionPayment(payload: SSLSubscriptionPaymentPayload): Promise<{ gateway_url: string; tran_id: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sslcommerz/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          type: 'subscription',
          product_name: `Seller Subscription: ${payload.plan_name || 'Plan'} (${payload.billing_cycle})`,
          product_category: 'Subscription',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.gateway_url) {
        throw new Error(data.error || 'Failed to initialize subscription payment.');
      }

      return {
        gateway_url: data.gateway_url,
        tran_id: data.tran_id,
      };
    } catch (err: any) {
      console.error('[SSLCommerz Subscription Error]:', err);
      throw new Error(err.message || 'Unable to start subscription payment.');
    }
  }

  /**
   * Query status of a transaction
   */
  static async getStatus(tranId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sslcommerz/status/${encodeURIComponent(tranId)}`);
      return await response.json();
    } catch (err: any) {
      console.error('[SSLCommerz Status Error]:', err);
      return null;
    }
  }
}
