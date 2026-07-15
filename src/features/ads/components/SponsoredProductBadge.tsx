import { Megaphone } from 'lucide-react';

export function SponsoredProductBadge() {
  return (
    <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2 py-1 bg-white/90 backdrop-blur-sm text-primary-600 rounded-lg shadow-sm border border-neutral-100 font-bold text-[10px] uppercase tracking-wider">
      <Megaphone size={12} className="fill-primary-100" />
      <span>Sponsored</span>
    </div>
  );
}
