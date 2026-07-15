import type { DeliveryService, DeliveryRequest, DeliveryDetails } from '../types/delivery.types';

export const pathaoService: DeliveryService = {
  provider: 'pathao',
  
  async createDeliveryRequest(request: DeliveryRequest) {
    console.log(`Creating Pathao delivery request for order ${request.orderId}`);
    await new Promise(resolve => setTimeout(resolve, 800));
    return { success: true, trackingNumber: `PTH-${Date.now().toString().slice(-8)}` };
  },

  async getTrackingDetails(trackingNumber: string): Promise<DeliveryDetails> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      trackingNumber,
      provider: 'pathao',
      currentStatus: 'picked_up',
      estimatedDeliveryDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      timeline: [
        { status: 'pending', timestamp: new Date(Date.now() - 86400000).toISOString(), description: 'Order created' },
        { status: 'picked_up', timestamp: new Date().toISOString(), description: 'Picked up by rider' }
      ]
    };
  },
  
  calculateDeliveryCharge(fromDistrict: string, toDistrict: string, weightGrams: number): number {
    let base = fromDistrict === toDistrict ? 60 : 120;
    if (weightGrams > 1000) base += Math.ceil((weightGrams - 1000) / 1000) * 20;
    return base;
  }
};
