import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  count?: number;
  size?: number;
  showCount?: boolean;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export function StarRating({ rating, count, size = 16, showCount = true, interactive = false, onChange }: StarRatingProps) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(star)}
            className={interactive ? 'cursor-pointer' : 'cursor-default'}
          >
            <Star
              size={size}
              className={star <= Math.round(rating) ? 'fill-accent-400 text-accent-400' : 'text-neutral-300'}
            />
          </button>
        ))}
      </div>
      {showCount && (
        <span className="text-sm text-neutral-500">
          {rating.toFixed(1)}{count !== undefined && ` (${count})`}
        </span>
      )}
    </div>
  );
}
