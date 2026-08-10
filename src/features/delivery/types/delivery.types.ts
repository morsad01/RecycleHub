export type CourierProvider = 'pathao' | 'redx' | 'steadfast' | 'paperfly' | 'manual';

export interface DeliveryTimelineEvent {
  status: 'pending' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed';
  timestamp: string;
  description?: string;
  location?: string;
}

export interface DeliveryDetails {
  trackingNumber: string;
  provider: CourierProvider;
  currentStatus: DeliveryTimelineEvent['status'];
  estimatedDeliveryDate?: string;
  timeline: DeliveryTimelineEvent[];
}

export interface DeliveryRequest {
  orderId: string;
  provider: CourierProvider;
  pickupAddress: any;
  deliveryAddress: any;
  parcelWeightGrams: number;
  codAmount?: number;
}

export interface DeliveryService {
  provider: CourierProvider;
  createDeliveryRequest(request: DeliveryRequest): Promise<{ success: boolean; trackingNumber?: string; errorMessage?: string }>;
  getTrackingDetails(trackingNumber: string): Promise<DeliveryDetails | null>;
  calculateDeliveryCharge(fromDistrict: string, toDistrict: string, weightGrams: number): number;
}
