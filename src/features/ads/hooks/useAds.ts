import { useState, useEffect } from 'react';
import type { Advertisement } from '../../../types';
import { adService } from '../services/adService';

export function useAds(type: Advertisement['type']) {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchAds() {
      setIsLoading(true);
      const data = await adService.getActiveAds(type);
      if (mounted) {
        setAds(data);
        setIsLoading(false);
        
        // Record impressions for fetched ads
        data.forEach(ad => {
          adService.recordImpression(ad.id);
        });
      }
    }

    fetchAds();
    return () => { mounted = false; };
  }, [type]);

  const handleAdClick = (ad: Advertisement) => {
    adService.recordClick(ad.id);
    if (ad.target_url) {
      window.open(ad.target_url, '_blank', 'noopener,noreferrer');
    }
  };

  return { ads, isLoading, handleAdClick };
}
