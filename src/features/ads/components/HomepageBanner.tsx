import { useState, useEffect } from 'react';
import { useAds } from '../hooks/useAds';
import { ExternalLink } from 'lucide-react';

export function HomepageBanner() {
  const { ads, isLoading, handleAdClick } = useAds('homepage_banner');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotate if multiple ads
  useEffect(() => {
    if (ads.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [ads.length]);

  if (isLoading || ads.length === 0) return null;

  const currentAd = ads[currentIndex];

  return (
    <div className="relative w-full h-[200px] md:h-[300px] bg-neutral-900 rounded-3xl overflow-hidden cursor-pointer group"
         onClick={() => handleAdClick(currentAd)}>
      
      <img 
        src={currentAd.image_url} 
        alt={currentAd.title}
        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-105"
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 md:p-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider rounded">
            Sponsored
          </span>
        </div>
        <h3 className="text-white text-2xl md:text-3xl font-bold mb-2">{currentAd.title}</h3>
        <div className="flex items-center gap-2 text-white/80 font-medium text-sm group-hover:text-white transition-colors">
          Learn more <ExternalLink size={14} />
        </div>
      </div>

      {/* Pagination Dots */}
      {ads.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {ads.map((_, idx) => (
            <div 
              key={idx}
              className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-white w-4' : 'bg-white/40'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
