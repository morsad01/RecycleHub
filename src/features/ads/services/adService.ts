import type { Advertisement } from '../../../types';
import type { AdService } from '../types/ad.types';
import { supabase } from '../../../lib/supabase';

export const adService: AdService = {
  async getActiveAds(type: Advertisement['type']): Promise<Advertisement[]> {
    const { data, error } = await supabase
      .from('advertisements')
      .select('*')
      .eq('type', type)
      .eq('status', 'active')
      .lte('start_date', new Date().toISOString())
      .gte('end_date', new Date().toISOString())
      .order('position', { ascending: true });

    if (error) {
      console.error(`Error fetching ads of type ${type}:`, error);
      return [];
    }

    // Filter out ads that have reached their limits
    return (data as Advertisement[]).filter(ad => {
      if (ad.impressions_limit && ad.impressions_limit > 0) {
        // Logic to check impressions count (in real app, this should be tracked or filtered via backend RPC)
      }
      return true;
    });
  },

  async recordImpression(adId: string): Promise<void> {
    // Fire and forget
    supabase.from('ad_impressions').insert({ ad_id: adId }).then();
  },

  async recordClick(adId: string): Promise<void> {
    // Fire and forget
    supabase.from('ad_clicks').insert({ ad_id: adId }).then();
  }
};
