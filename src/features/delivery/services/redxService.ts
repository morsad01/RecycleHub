import type { DeliveryService, DeliveryRequest, DeliveryDetails } from '../types/delivery.types';

export const redxService: DeliveryService = {
  provider: 'redx',
  
  async createDeliveryRequest(request: DeliveryRequest) {
    console.log(`Creating RedX delivery request for order ${request.orderId}`);
    await new Promise(resolve => setTimeout(resolve, 800));
    return { success: true, trackingNumber: `RDX-${Date.now().toString().slice(-8)}` };
  },

  async getTrackingDetails(trackingNumber: string): Promise<DeliveryDetails> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      trackingNumber,
      provider: 'redx',
      currentStatus: 'pending',
      timeline: [
        { status: 'pending', timestamp: new Date().toISOString(), description: 'Request received' }
      ]
    };
  },
  
  calculateDeliveryCharge(fromDistrict: string, toDistrict: string, weightGrams: number): number {
    let base = fromDistrict === toDistrict ? 50 : 110;
    if (weightGrams > 1000) base += Math.ceil((weightGrams - 1000) / 1000) * 15;
    return base;
  }
};
