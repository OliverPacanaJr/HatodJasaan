'use client';

import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
  showValue?: boolean;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onChange,
  showValue = false,
}: StarRatingProps) {
  const sizes = { sm: 'h-3.5 w-3.5', md: 'h-5 w-5', lg: 'h-6 w-6' };

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxRating }, (_, i) => {
        const filled = i < Math.floor(rating);
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(i + 1)}
            className={cn(
              'transition-colors',
              interactive && 'cursor-pointer hover:scale-110',
              !interactive && 'cursor-default'
            )}
          >
            {filled ? (
              <StarIcon className={cn(sizes[size], 'text-yellow-400')} />
            ) : (
              <StarOutline className={cn(sizes[size], 'text-slate-300')} />
            )}
          </button>
        );
      })}
      {showValue && (
        <span className="ml-1 text-sm font-medium text-slate-600">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
