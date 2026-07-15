import { MapPin } from 'lucide-react';

interface ProductMapPinProps {
  locationText?: string;
  distanceKm?: number;
  onClick?: () => void;
}

export function ProductMapPin({ locationText, distanceKm, onClick }: ProductMapPinProps) {
  if (!locationText && !distanceKm) return null;
  
  return (
    <button 
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-sm font-medium transition-colors"
    >
      <MapPin size={16} className="text-primary-600" />
      <span className="truncate max-w-[150px]">{locationText || 'View Map'}</span>
      {distanceKm && (
        <span className="text-neutral-400 pl-1 border-l border-neutral-300">
          {distanceKm < 1 ? '<1km' : `${distanceKm.toFixed(1)}km`}
        </span>
      )}
    </button>
  );
}
