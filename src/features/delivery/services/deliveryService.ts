import type { CourierProvider, DeliveryService, DeliveryRequest, DeliveryDetails } from '../types/delivery.types';
import { pathaoService } from './pathaoService';
import { redxService } from './redxService';

// We can add steadfast and paperfly later
const providers: Record<string, DeliveryService> = {
  pathao: pathaoService,
  redx: redxService,
};

export class DeliveryGateway {
  static async createRequest(provider: CourierProvider, request: DeliveryRequest) {
    const service = providers[provider];
    if (!service) return { success: false, errorMessage: 'Provider not configured' };
    return await service.createDeliveryRequest(request);
  }

  static async track(provider: CourierProvider, trackingNumber: string) {
    const service = providers[provider];
    if (!service) return null;
    return await service.getTrackingDetails(trackingNumber);
  }
  
  static estimateCharge(provider: CourierProvider, fromDistrict: string, toDistrict: string, weight: number) {
    const service = providers[provider];
    if (!service) return 60; // fallback base charge
    return service.calculateDeliveryCharge(fromDistrict, toDistrict, weight);
  }
}
