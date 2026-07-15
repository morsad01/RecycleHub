import type { Advertisement } from '../../../types';

export interface AdService {
  getActiveAds(type: Advertisement['type']): Promise<Advertisement[]>;
  recordImpression(adId: string): Promise<void>;
  recordClick(adId: string): Promise<void>;
}
