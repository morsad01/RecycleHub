import { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { useI18n } from '../../../i18n/I18nContext';

interface FlashSaleBannerProps {
  endDate: string;
  title?: string;
  discountText?: string;
}

export function FlashSaleBanner({ endDate, title = 'Flash Sale', discountText = 'Up to 50% Off' }: FlashSaleBannerProps) {
  const { t } = useI18n();
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const end = new Date(endDate).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = end - now;

      if (distance < 0) {
        setTimeLeft(null);
        return;
      }

      setTimeLeft({
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  if (!timeLeft) return null;

  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg overflow-hidden relative">
      <div className="absolute -right-4 -top-8 text-white/10 rotate-12">
        <Zap size={150} />
      </div>
      
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
            <Zap size={24} className="text-white fill-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold">{title}</h3>
            <p className="text-white/80 font-medium mt-1">{discountText}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-white/80 whitespace-nowrap">
            {t('promo.endsIn') || 'Ends in'}
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg text-center min-w-[50px]">
              <span className="block text-xl font-bold leading-none">{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 mt-1 block">Hrs</span>
            </div>
            <span className="text-xl font-bold animate-pulse">:</span>
            <div className="bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg text-center min-w-[50px]">
              <span className="block text-xl font-bold leading-none">{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 mt-1 block">Min</span>
            </div>
            <span className="text-xl font-bold animate-pulse">:</span>
            <div className="bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg text-center min-w-[50px]">
              <span className="block text-xl font-bold leading-none">{String(timeLeft.seconds).padStart(2, '0')}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 mt-1 block">Sec</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
