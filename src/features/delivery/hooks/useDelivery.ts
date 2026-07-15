import { useState } from 'react';
import type { CourierProvider, DeliveryRequest, DeliveryDetails } from '../types/delivery.types';
import { DeliveryGateway } from '../services/deliveryService';

export function useDelivery() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRequest = async (provider: CourierProvider, request: DeliveryRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      return await DeliveryGateway.createRequest(provider, request);
    } catch (err: any) {
      setError(err.message || 'Delivery request failed');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const trackDelivery = async (provider: CourierProvider, trackingNumber: string) => {
    setIsLoading(true);
    setError(null);
    try {
      return await DeliveryGateway.track(provider, trackingNumber);
    } catch (err: any) {
      setError(err.message || 'Tracking failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, error, createRequest, trackDelivery };
}
